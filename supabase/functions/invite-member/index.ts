// Supabase Edge Function: invite-member
// Creates a confirmed member login (admin-only capability) and returns a
// temporary password to share. Deploy via the Supabase dashboard (Edge
// Functions → Deploy new function) or `supabase functions deploy invite-member`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function tempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const { email, name, teamId } = await req.json();
    if (!email) return json({ error: 'email is required' }, 400);

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey);

    // Identify the caller (the admin) from their JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const { data: caller } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    const inviterId = caller?.user?.id ?? null;

    // Create a confirmed member account with a temporary password.
    const password = tempPassword();
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) return json({ error: error.message }, 400);

    const memberId = created.user.id;
    // Member accounts are creators (they do the content work).
    await admin.from('profiles').update({ role: 'creator', name: name ?? null }).eq('id', memberId);

    // Link to the team + record the invite.
    if (teamId) {
      await admin.from('team_members').insert({ team_id: teamId, profile_id: memberId, status: 'approved' });
    }
    await admin.from('invites').insert({ team_id: teamId ?? null, inviter_id: inviterId, name: name ?? null, email, code: password, status: 'provisioned' });

    return json({ userId: memberId, email, tempPassword: password });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
