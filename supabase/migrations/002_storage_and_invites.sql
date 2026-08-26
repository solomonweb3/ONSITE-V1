-- ============================================================================
-- ONSITE — Storage bucket, Storage policies, and invites table.
-- Run this in Supabase → SQL Editor after schema.sql. Safe to re-run.
-- ============================================================================

-- 1) Create the "content" bucket for uploaded photos/videos (public read).
insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do update set public = true;

-- 2) Storage policies: anyone can read; signed-in users can upload/update.
drop policy if exists "content read" on storage.objects;
create policy "content read" on storage.objects
  for select using (bucket_id = 'content');

drop policy if exists "content insert" on storage.objects;
create policy "content insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'content');

drop policy if exists "content update" on storage.objects;
create policy "content update" on storage.objects
  for update to authenticated using (bucket_id = 'content');

-- 3) invites table — tracks members an admin has invited.
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references public.teams(id) on delete cascade,
  inviter_id uuid references public.profiles(id) on delete set null,
  name       text,
  email      text not null,
  code       text not null,
  status     text not null default 'invited',
  created_at timestamptz not null default now()
);

create index if not exists idx_invites_inviter on public.invites(inviter_id);

alter table public.invites enable row level security;

drop policy if exists invites_owner on public.invites;
create policy invites_owner on public.invites
  for all using (inviter_id = auth.uid()) with check (inviter_id = auth.uid());

-- ============================================================================
-- Done. Uploaded files will now persist to Storage, and invites to the DB.
-- ============================================================================
