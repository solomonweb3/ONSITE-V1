import { supabase } from '../lib/supabase';
import { SEED_ACTIVATIONS, SEED_NOTIFICATIONS } from './seeds';
import type { Activation, ChecklistItem, AppNotification } from '../store';
import type { BadgeStatus } from '../components/ui';

/* ------------------------------- mappers ---------------------------------- */

const statusToDb: Record<string, string> = { Live: 'live', Completed: 'completed', Paid: 'paid' };
const statusFromDb: Record<string, BadgeStatus> = { live: 'Live', completed: 'Completed', paid: 'Paid' };

type ItemRow = {
  id: string;
  title: string;
  owner: 'client' | 'my';
  due_label: string | null;
  state: ChecklistItem['state'];
  caption: string | null;
  media_label: string | null;
  media_url: string | null;
  reject_reason: string | null;
  position: number;
};

type ActivationRow = {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  checklist_items: ItemRow[];
};

function mapItem(r: ItemRow): ChecklistItem {
  return {
    id: r.id,
    title: r.title,
    owner: r.owner,
    due: r.due_label ?? '',
    state: r.state,
    caption: r.caption ?? undefined,
    photoLabel: r.media_label ?? undefined,
    mediaUri: r.media_url ?? undefined,
    rejectReason: r.reject_reason ?? undefined,
  };
}

function mapActivation(r: ActivationRow): Activation {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? '',
    status: statusFromDb[r.status] ?? 'Live',
    items: (r.checklist_items ?? []).slice().sort((a, b) => a.position - b.position).map(mapItem),
  };
}

/* ------------------------------- profile ---------------------------------- */

export async function hydrateProfile(uid: string, role: 'creator' | 'team', email?: string | null) {
  // Ensure the profile has at least a handle derived from the email.
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
  const fallbackHandle = email ? '@' + email.split('@')[0] : undefined;
  const patch: Record<string, unknown> = { role };
  if (data && !data.handle && fallbackHandle) patch.handle = fallbackHandle;
  if (data && !data.name && email) patch.name = email.split('@')[0];
  await supabase.from('profiles').update(patch).eq('id', uid);
  const { data: fresh } = await supabase.from('profiles').select('*').eq('id', uid).single();
  return fresh;
}

/* ----------------------------- activations -------------------------------- */

export async function loadActivations(uid: string): Promise<Activation[]> {
  const { data, error } = await supabase
    .from('activations')
    .select('id, title, subtitle, status, checklist_items(id, title, owner, due_label, state, caption, media_label, media_url, reject_reason, position)')
    .eq('creator_id', uid)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ActivationRow[]).map(mapActivation);
}

export async function seedActivations(uid: string) {
  for (const a of SEED_ACTIVATIONS) {
    const { data: act, error } = await supabase
      .from('activations')
      .insert({ creator_id: uid, title: a.title, subtitle: a.subtitle, status: statusToDb[a.status] ?? 'live', views: 48200, engagement: 6.1 })
      .select('id')
      .single();
    if (error || !act) throw error;
    const rows = a.items.map((it, idx) => ({
      activation_id: act.id,
      title: it.title,
      owner: it.owner,
      due_label: it.due,
      state: it.state,
      caption: it.caption ?? null,
      media_label: it.photoLabel ?? null,
      reject_reason: it.rejectReason ?? null,
      position: idx,
    }));
    const { error: itemsErr } = await supabase.from('checklist_items').insert(rows);
    if (itemsErr) throw itemsErr;
  }
}

export type NewActivationInput = {
  title: string;
  subtitle: string;
  status: BadgeStatus; // 'Live' | 'Completed'
  items: { title: string; owner: 'client' | 'my'; due: string }[];
};

export async function createActivationRemote(uid: string, input: NewActivationInput): Promise<Activation> {
  const { data: act, error } = await supabase
    .from('activations')
    .insert({ creator_id: uid, title: input.title, subtitle: input.subtitle, status: statusToDb[input.status] ?? 'live' })
    .select('id')
    .single();
  if (error || !act) throw error;

  let items: ChecklistItem[] = [];
  if (input.items.length) {
    const rows = input.items.map((it, idx) => ({
      activation_id: act.id,
      title: it.title,
      owner: it.owner,
      due_label: it.due,
      state: 'todo' as const,
      position: idx,
    }));
    const { data: inserted, error: e2 } = await supabase.from('checklist_items').insert(rows).select('*');
    if (e2) throw e2;
    items = (inserted as ItemRow[]).slice().sort((a, b) => a.position - b.position).map(mapItem);
  }
  return { id: act.id, title: input.title, subtitle: input.subtitle, status: input.status, items };
}

/* ------------------------------ mutations --------------------------------- */

export async function submitItemRemote(itemId: string, caption: string, mediaLabel: string, mediaUrl?: string) {
  await supabase
    .from('checklist_items')
    .update({ state: 'submitted', caption, media_label: mediaLabel, media_url: mediaUrl ?? null, reject_reason: null, submitted_at: new Date().toISOString() })
    .eq('id', itemId);
}

// Upload a captured file to the "content" Storage bucket, return its public URL.
export async function uploadContent(uid: string, fileUri: string, ext: string, contentType: string): Promise<string> {
  const path = `${uid}/${Date.now()}.${ext}`;
  const res = await fetch(fileUri);
  const blob = await res.blob();
  const { error } = await supabase.storage.from('content').upload(path, blob, { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('content').getPublicUrl(path);
  return data.publicUrl;
}

export async function setItemStateRemote(itemId: string, state: ChecklistItem['state'], rejectReason?: string) {
  const patch: Record<string, unknown> = { state, reviewed_at: new Date().toISOString() };
  if (state === 'rejected') patch.reject_reason = rejectReason ?? '';
  await supabase.from('checklist_items').update(patch).eq('id', itemId);
}

/* ---------------------------- notifications ------------------------------- */

type NotifRow = { id: string; title: string; body: string | null; read: boolean; created_at: string };

function relTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.round(diffMs / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export async function loadNotifications(uid: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, read, created_at')
    .eq('profile_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as NotifRow[]).map((n) => ({ id: n.id, title: n.title, body: n.body ?? '', time: relTime(n.created_at), unread: !n.read }));
}

export async function seedNotifications(uid: string) {
  const rows = SEED_NOTIFICATIONS.map(([title, body, hoursAgo]) => ({
    profile_id: uid,
    title,
    body,
    read: hoursAgo >= 24,
    created_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  }));
  await supabase.from('notifications').insert(rows);
}

export async function markAllReadRemote(uid: string) {
  await supabase.from('notifications').update({ read: true }).eq('profile_id', uid).eq('read', false);
}

/* -------------------------------- invites --------------------------------- */

export type InviteRow = { id: string; name: string; email: string; code: string };

// Provision a real member login via the admin Edge Function.
export async function inviteMemberRemote(name: string, email: string): Promise<{ email: string; tempPassword: string }> {
  const { data, error } = await supabase.functions.invoke('invite-member', { body: { email, name } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return { email: data.email, tempPassword: data.tempPassword };
}

export async function loadInvites(uid: string): Promise<InviteRow[]> {
  const { data } = await supabase.from('invites').select('id, name, email, code').eq('inviter_id', uid).order('created_at', { ascending: false });
  return (data ?? []).map((r: { id: string; name: string | null; email: string; code: string }) => ({ id: r.id, name: r.name ?? '', email: r.email, code: r.code }));
}

/* ------------------------------ bootstrap --------------------------------- */

// Load a user's data. New accounts start empty — they create their own
// activations (or link email later). No demo/brand seeding.
export async function bootstrapUserData(uid: string) {
  const activations = await loadActivations(uid);
  const notifications = await loadNotifications(uid);
  return { activations, notifications };
}
