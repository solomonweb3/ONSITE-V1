-- Email linking (Gmail / Outlook OAuth)
-- Stores the per-user OAuth refresh token so an Edge Function can pull brand
-- emails and turn them into draft activations. One connection per user+provider.

create table if not exists public.email_connections (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references auth.users (id) on delete cascade,
  provider       text not null default 'google',      -- 'google' | 'microsoft'
  email          text,                                 -- the linked mailbox address
  refresh_token  text,                                 -- long-lived; used to mint access tokens
  access_token   text,                                 -- short-lived cache
  token_expiry   timestamptz,
  last_synced_at timestamptz,
  history_id     text,                                 -- Gmail incremental-sync cursor
  created_at     timestamptz not null default now(),
  unique (profile_id, provider)
);

alter table public.email_connections enable row level security;

-- A user can see and manage only their own connection. The gmail-sync Edge
-- Function uses the service-role key and bypasses RLS.
drop policy if exists ec_select_own on public.email_connections;
create policy ec_select_own on public.email_connections
  for select using (auth.uid() = profile_id);

drop policy if exists ec_insert_own on public.email_connections;
create policy ec_insert_own on public.email_connections
  for insert with check (auth.uid() = profile_id);

drop policy if exists ec_update_own on public.email_connections;
create policy ec_update_own on public.email_connections
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists ec_delete_own on public.email_connections;
create policy ec_delete_own on public.email_connections
  for delete using (auth.uid() = profile_id);
