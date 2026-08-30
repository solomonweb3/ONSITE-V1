// Supabase Edge Function: gmail-sync
// Pulls recent brand-looking emails from a member's linked Gmail and turns
// them into DRAFT activations they can review & confirm in the app.
//
// Requires these function secrets (set once):
//   supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Keywords that suggest a brand collab / activation email.
const BRAND_HINTS = [
  'collab', 'partnership', 'partner', 'campaign', 'activation', 'launch',
  'sponsor', 'gifting', 'gifted', 'ambassador', 'ugc', 'brand', 'deliverable',
  'content creator', 'paid', 'rate', 'brief',
];

function header(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

// "Rare Beauty <team@rarebeauty.com>" -> { name: 'Rare Beauty', domain: 'rarebeauty.com' }
function parseFrom(from: string): { name: string; domain: string } {
  const m = from.match(/^\s*"?([^"<]*)"?\s*<?([^>]*)>?\s*$/);
  const display = (m?.[1] ?? '').trim();
  const addr = (m?.[2] ?? from).trim();
  const domain = addr.split('@')[1] ?? '';
  const name = display || domain.split('.')[0] || addr;
  return { name, domain };
}

async function accessTokenFromRefresh(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
    client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || 'token refresh failed');
  return json.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Who's calling?
    const authHeader = req.headers.get('Authorization') ?? '';
    const { data: caller } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    const uid = caller?.user?.id;
    if (!uid) return json({ error: 'not authenticated' }, 401);

    // Their linked mailbox.
    const { data: conn } = await admin
      .from('email_connections')
      .select('refresh_token')
      .eq('profile_id', uid)
      .eq('provider', 'google')
      .maybeSingle();
    if (!conn?.refresh_token) return json({ error: 'no linked email' }, 400);

    // The team to attach drafts to (so the owner can see them once confirmed).
    const { data: membership } = await admin
      .from('team_members')
      .select('team_id')
      .eq('profile_id', uid)
      .eq('status', 'approved')
      .maybeSingle();
    const teamId = membership?.team_id ?? null;

    const accessToken = await accessTokenFromRefresh(conn.refresh_token);
    const gmail = (path: string) =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());

    // Recent inbox messages (last 30 days).
    const list = await gmail('messages?maxResults=25&q=' + encodeURIComponent('newer_than:30d in:inbox'));
    const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);

    let created = 0;
    const drafts: { title: string; from: string }[] = [];

    for (const id of ids) {
      const msg = await gmail(`messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`);
      const headers = msg.payload?.headers ?? [];
      const subject = header(headers, 'Subject');
      const from = header(headers, 'From');
      const snippet: string = msg.snippet ?? '';
      const haystack = `${subject} ${snippet}`.toLowerCase();
      if (!BRAND_HINTS.some((k) => haystack.includes(k))) continue;

      const { name } = parseFrom(from);
      const title = subject.slice(0, 80) || `${name} activation`;

      // Insert the draft; the unique (creator_id, source_ref) index dedupes.
      const { data: act, error } = await admin
        .from('activations')
        .insert({
          creator_id: uid,
          team_id: teamId,
          title,
          subtitle: name,
          status: 'live',
          source: 'email',
          is_draft: true,
          source_ref: id,
        })
        .select('id')
        .single();
      if (error) continue; // duplicate (already imported) or RLS — skip quietly
      if (act) {
        await admin.from('checklist_items').insert({
          activation_id: act.id,
          title: 'Deliver content',
          owner: 'my',
          due_label: 'TBD',
          state: 'todo',
          position: 0,
        });
        created++;
        drafts.push({ title, from: name });
      }
    }

    await admin.from('email_connections').update({ last_synced_at: new Date().toISOString() }).eq('profile_id', uid);
    return json({ scanned: ids.length, created, drafts });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
