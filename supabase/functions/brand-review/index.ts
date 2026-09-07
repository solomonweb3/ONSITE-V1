// Supabase Edge Function: brand-review
// A public, no-login review page for brands. The creator shares a magic link:
//   https://<project>.functions.supabase.co/brand-review?token=<review_token>
// (or /functions/v1/brand-review?token=...). The brand opens it in any browser,
// sees the delivered content, and approves or requests changes per item.
//
// Security model: the page is public, but everything is scoped by the secret
// token. We resolve token -> activation with the service role (never exposing
// other activations), and only ever act on items belonging to that one
// activation. No RLS is opened to the anon role.
//
// This function must NOT verify a JWT (brands are logged out):
//   supabase/config.toml -> [functions.brand-review] verify_jwt = false
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

type ItemRow = {
  id: string;
  activation_id: string;
  title: string;
  state: 'todo' | 'submitted' | 'approved' | 'rejected';
  caption: string | null;
  media_url: string | null;
  media_label: string | null;
  reject_reason: string | null;
  position: number;
};

type ActivationRow = {
  id: string;
  creator_id: string;
  title: string;
  subtitle: string | null;
};

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const isVideo = (s: string | null) => !!s && /\.(mp4|mov|webm)(\?|$)/i.test(s);
const isExternalLink = (s: string | null) => !!s && !/\/storage\/v1\/object\/public\//.test(s) && /^https?:\/\//i.test(s);

async function loadByToken(token: string): Promise<{ activation: ActivationRow; items: ItemRow[] } | null> {
  const db = admin();
  const { data: activation } = await db
    .from('activations')
    .select('id, creator_id, title, subtitle')
    .eq('review_token', token)
    .maybeSingle();
  if (!activation) return null;
  const { data: items } = await db
    .from('checklist_items')
    .select('id, activation_id, title, state, caption, media_url, media_label, reject_reason, position')
    .eq('activation_id', activation.id)
    .order('position', { ascending: true });
  return { activation: activation as ActivationRow, items: (items as ItemRow[]) ?? [] };
}

/* -------------------------------- decisions ------------------------------- */

async function handleDecision(body: {
  token?: string;
  itemId?: string;
  decision?: 'approve' | 'reject';
  reason?: string;
}) {
  const token = (body.token ?? '').trim();
  const itemId = (body.itemId ?? '').trim();
  const decision = body.decision;
  if (!token || !itemId || (decision !== 'approve' && decision !== 'reject')) {
    return { status: 400, body: { error: 'bad request' } };
  }
  if (decision === 'reject' && !(body.reason ?? '').trim()) {
    return { status: 400, body: { error: 'A note is required when requesting changes.' } };
  }

  const loaded = await loadByToken(token);
  if (!loaded) return { status: 404, body: { error: 'This review link is invalid or has been revoked.' } };

  // The item must belong to THIS activation and be awaiting review.
  const item = loaded.items.find((i) => i.id === itemId);
  if (!item) return { status: 404, body: { error: 'item not found' } };
  if (item.state !== 'submitted') {
    return { status: 409, body: { error: 'This item is no longer awaiting review.' } };
  }

  const db = admin();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> =
    decision === 'approve'
      ? { state: 'approved', reviewed_at: nowIso, reject_reason: null }
      : { state: 'rejected', reviewed_at: nowIso, reject_reason: (body.reason ?? '').trim() };
  const { error } = await db.from('checklist_items').update(patch).eq('id', item.id);
  if (error) return { status: 500, body: { error: 'Could not save your decision.' } };

  // Notify the creator.
  const verb = decision === 'approve' ? 'approved' : 'requested changes on';
  await db.from('notifications').insert({
    profile_id: loaded.activation.creator_id,
    title: `${loaded.activation.title}: ${item.title} ${verb}`,
    body:
      decision === 'approve'
        ? 'The brand approved this deliverable.'
        : `The brand requested changes: ${(body.reason ?? '').trim()}`,
    read: false,
  });

  return { status: 200, body: { ok: true, state: patch.state } };
}

/* ---------------------------------- page ---------------------------------- */

function mediaBlock(item: ItemRow): string {
  const url = item.media_url;
  if (!url) return `<div class="ph">No preview provided</div>`;
  if (isVideo(url)) return `<video class="media" src="${esc(url)}" controls playsinline preload="metadata"></video>`;
  if (isExternalLink(url))
    return `<a class="linkout" href="${esc(url)}" target="_blank" rel="noopener">Open submitted link ↗</a>`;
  return `<img class="media" src="${esc(url)}" alt="${esc(item.title)}" />`;
}

function itemBlock(item: ItemRow): string {
  const badge =
    item.state === 'approved'
      ? `<span class="badge ok">Approved</span>`
      : item.state === 'rejected'
      ? `<span class="badge no">Changes requested</span>`
      : item.state === 'submitted'
      ? `<span class="badge live">Awaiting your review</span>`
      : `<span class="badge muted">Not delivered yet</span>`;

  const caption = item.caption ? `<p class="cap">${esc(item.caption)}</p>` : '';
  const priorReason =
    item.state === 'rejected' && item.reject_reason
      ? `<p class="reason">Your note: ${esc(item.reject_reason)}</p>`
      : '';

  const actions =
    item.state === 'submitted'
      ? `<div class="actions" data-item="${esc(item.id)}">
           <button class="btn approve" data-act="approve">Approve</button>
           <button class="btn reject" data-act="reject">Request changes</button>
         </div>
         <div class="rejectbox" hidden>
           <textarea placeholder="What needs to change? This note goes straight to the creator."></textarea>
           <button class="btn send" data-act="send">Send request</button>
         </div>`
      : '';

  return `<section class="item" id="item-${esc(item.id)}">
    <div class="itemhead"><h3>${esc(item.title)}</h3>${badge}</div>
    ${mediaBlock(item)}
    ${caption}
    ${priorReason}
    ${actions}
  </section>`;
}

function renderPage(token: string, activation: ActivationRow, items: ItemRow[]): string {
  const submitted = items.filter((i) => i.state === 'submitted').length;
  const approved = items.filter((i) => i.state === 'approved').length;
  const summary =
    submitted > 0
      ? `${submitted} item${submitted === 1 ? '' : 's'} awaiting your review`
      : `All caught up — nothing needs your review right now.`;

  const body = items.length
    ? items.map(itemBlock).join('\n')
    : `<p class="empty">No deliverables have been added yet.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(activation.title)} — Review</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fafafa; color: #0a0a0a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 640px; margin: 0 auto; padding: 24px 20px 64px; }
  .kicker { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .08em;
    text-transform: uppercase; color: #737373; }
  h1 { font-size: 24px; margin: 4px 0 2px; }
  .sub { color: #737373; font-size: 14px; margin: 0; }
  .summary { margin: 18px 0 8px; padding: 12px 16px; background: #f4f4f5; border-radius: 10px;
    font-size: 13px; font-weight: 600; }
  .item { border-top: 1px solid #ececec; padding: 22px 0; }
  .itemhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .itemhead h3 { font-size: 16px; margin: 0; }
  .badge { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .04em; text-transform: uppercase;
    padding: 4px 8px; border-radius: 999px; white-space: nowrap; }
  .badge.ok { background: #06331f; color: #b6f0d0; }
  .badge.no { background: #3a0f0c; color: #f3c9c4; }
  .badge.live { background: #111; color: #fff; }
  .badge.muted { background: #ececec; color: #737373; }
  .media { width: 100%; max-height: 460px; object-fit: cover; border-radius: 14px; background: #000; display: block; }
  .ph, .linkout { display: block; padding: 28px; text-align: center; border-radius: 14px; background: #111; color: #fff;
    font-family: ui-monospace, monospace; font-size: 12px; text-decoration: none; }
  .cap { color: #52525b; font-size: 14px; margin: 12px 2px 0; }
  .reason { color: #b4231a; font-size: 13px; margin: 8px 2px 0; }
  .actions { display: flex; gap: 10px; margin-top: 16px; }
  .btn { flex: 1; height: 46px; border: 0; border-radius: 9px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .btn.approve { background: #06331f; color: #b6f0d0; }
  .btn.reject { background: #f4f4f5; color: #0a0a0a; }
  .rejectbox { margin-top: 12px; }
  .rejectbox textarea { width: 100%; min-height: 96px; border: 1.5px solid #111; border-radius: 10px; padding: 14px;
    font: inherit; font-size: 14px; resize: vertical; }
  .btn.send { background: #b4231a; color: #fff; margin-top: 10px; width: 100%; }
  .empty, .footnote { color: #a1a1aa; font-size: 13px; }
  .footnote { text-align: center; margin-top: 40px; font-family: ui-monospace, monospace; font-size: 11px; }
  .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: #111; color: #fff;
    padding: 12px 18px; border-radius: 10px; font-size: 13px; opacity: 0; transition: opacity .2s; pointer-events: none; }
  .toast.show { opacity: 1; }
</style>
</head>
<body>
  <div class="wrap">
    <p class="kicker">Brand review${approved ? ` · ${approved} approved` : ''}</p>
    <h1>${esc(activation.title)}</h1>
    <p class="sub">${esc(activation.subtitle ?? '')}</p>
    <div class="summary">${esc(summary)}</div>
    ${body}
    <p class="footnote">Powered by ONSITE · your decisions notify the creator instantly</p>
  </div>
  <div class="toast" id="toast"></div>
<script>
  var TOKEN = ${JSON.stringify(token)};
  var toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  async function decide(itemId, decision, reason) {
    var res = await fetch(location.pathname + location.search, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: TOKEN, itemId: itemId, decision: decision, reason: reason })
    });
    var data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) { showToast(data.error || 'Something went wrong.'); return; }
    showToast(decision === 'approve' ? 'Approved — creator notified.' : 'Change request sent.');
    setTimeout(function () { location.reload(); }, 900);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    var itemEl = btn.closest('.item');
    var itemId = itemEl.querySelector('.actions').getAttribute('data-item');
    if (act === 'approve') { decide(itemId, 'approve'); }
    else if (act === 'reject') {
      itemEl.querySelector('.actions').hidden = true;
      itemEl.querySelector('.rejectbox').hidden = false;
    } else if (act === 'send') {
      var reason = itemEl.querySelector('.rejectbox textarea').value.trim();
      if (!reason) { showToast('Please add a note so the creator knows what to change.'); return; }
      decide(itemId, 'reject', reason);
    }
  });
</script>
</body>
</html>`;
}

function invalidPage(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Review link</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
background:#fafafa;color:#0a0a0a;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}
.b{max-width:360px;padding:24px}h1{font-size:20px}p{color:#737373;font-size:14px}</style></head>
<body><div class="b"><h1>This review link isn't valid</h1>
<p>It may have been revoked or mistyped. Ask the creator to send you a fresh link.</p></div></body></html>`;
}

/* --------------------------------- serve ---------------------------------- */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const html = (markup: string, status = 200) =>
    new Response(markup, { status, headers: { ...cors, 'Content-Type': 'text/html; charset=utf-8' } });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { status, body: out } = await handleDecision(body);
      return json(out, status);
    }

    // GET -> the review page.
    const token = (new URL(req.url).searchParams.get('token') ?? '').trim();
    if (!token) return html(invalidPage(), 400);
    const loaded = await loadByToken(token);
    if (!loaded) return html(invalidPage(), 404);
    return html(renderPage(token, loaded.activation, loaded.items));
  } catch (_e) {
    return html(invalidPage(), 500);
  }
});
