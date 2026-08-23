-- ============================================================================
-- ONSITE — Supabase schema
-- Paste this whole file into the Supabase dashboard → SQL Editor → Run.
-- Safe to re-run: enums are guarded, tables use IF NOT EXISTS, policies are
-- dropped-then-created.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto (already available on Supabase).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Enums (mirror the TypeScript unions in the app)
-- ----------------------------------------------------------------------------
do $$ begin create type account_role      as enum ('creator','team');                    exception when duplicate_object then null; end $$;
do $$ begin create type activation_status as enum ('live','completed','paid');            exception when duplicate_object then null; end $$;
do $$ begin create type item_owner        as enum ('client','my');                        exception when duplicate_object then null; end $$;
do $$ begin create type item_state        as enum ('todo','submitted','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type member_status     as enum ('pending','approved','denied');        exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. profiles — one row per signed-in user, keyed to Supabase Auth.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text,
  handle           text unique,
  phone            text,
  role             account_role not null default 'creator',
  bio              text,
  location         text,
  followers        text,               -- display label e.g. "48.2K"
  avatar_url       text,
  profile_complete boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. teams + team_members (agency / multi-creator side)
-- ----------------------------------------------------------------------------
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  join_code  text unique,
  photo_url  text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status     member_status not null default 'pending',
  role       text,                     -- free-text label e.g. "Videographer"
  created_at timestamptz not null default now(),
  unique (team_id, profile_id)
);

-- ----------------------------------------------------------------------------
-- 4. activations — a brand deal owned by a creator (optionally under a team).
-- ----------------------------------------------------------------------------
create table if not exists public.activations (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  team_id    uuid references public.teams(id) on delete set null,
  title      text not null,            -- brand name, e.g. "Ledger Sunglasses"
  subtitle   text,                     -- e.g. "Summer Pop-Up · Venice Beach"
  status     activation_status not null default 'live',
  views      integer not null default 0,
  engagement numeric(5,2) not null default 0,   -- percentage, e.g. 6.10
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. checklist_items — the deliverables inside an activation.
-- ----------------------------------------------------------------------------
create table if not exists public.checklist_items (
  id            uuid primary key default gen_random_uuid(),
  activation_id uuid not null references public.activations(id) on delete cascade,
  title         text not null,         -- "1x Instagram Reel"
  owner         item_owner not null default 'client',
  due_label     text,                  -- "6:00 PM" / "Delivered"
  due_at        timestamptz,           -- optional real datetime
  state         item_state not null default 'todo',
  caption       text,                  -- creator note to the brand
  media_url     text,                  -- Storage URL of captured photo/video
  media_label   text,                  -- filename / link shown in the UI
  reject_reason text,                  -- brand's required note when rejected
  position      integer not null default 0,   -- ordering within the checklist
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. notifications — per-user activity feed.
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes for the common lookups
-- ----------------------------------------------------------------------------
create index if not exists idx_activations_creator     on public.activations(creator_id);
create index if not exists idx_activations_team        on public.activations(team_id);
create index if not exists idx_checklist_activation    on public.checklist_items(activation_id);
create index if not exists idx_team_members_team       on public.team_members(team_id);
create index if not exists idx_team_members_profile    on public.team_members(profile_id);
create index if not exists idx_notifications_profile   on public.notifications(profile_id);

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on profiles + activations.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_activations_touch on public.activations;
create trigger trg_activations_touch before update on public.activations
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Helper functions for team access checks (SECURITY DEFINER avoids RLS
-- recursion when a policy needs to look at team_members).
-- ----------------------------------------------------------------------------
create or replace function public.is_team_owner(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from teams where id = t and owner_id = auth.uid());
$$;

create or replace function public.is_team_member(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from team_members
    where team_id = t and profile_id = auth.uid() and status = 'approved'
  );
$$;

-- ============================================================================
-- Row Level Security
-- Each user reaches only their own data (brand external-review is a later,
-- separate mechanism). Enable RLS, then define policies.
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.teams           enable row level security;
alter table public.team_members    enable row level security;
alter table public.activations     enable row level security;
alter table public.checklist_items enable row level security;
alter table public.notifications   enable row level security;

-- profiles --------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_upsert_own on public.profiles;
create policy profiles_upsert_own on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- teams -----------------------------------------------------------------------
drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams
  for select using (owner_id = auth.uid() or public.is_team_member(id));

drop policy if exists teams_owner_write on public.teams;
create policy teams_owner_write on public.teams
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- team_members ----------------------------------------------------------------
drop policy if exists team_members_read on public.team_members;
create policy team_members_read on public.team_members
  for select using (profile_id = auth.uid() or public.is_team_owner(team_id));

drop policy if exists team_members_owner_write on public.team_members;
create policy team_members_owner_write on public.team_members
  for all using (public.is_team_owner(team_id)) with check (public.is_team_owner(team_id));

drop policy if exists team_members_self_join on public.team_members;
create policy team_members_self_join on public.team_members
  for insert with check (profile_id = auth.uid());

-- activations -----------------------------------------------------------------
drop policy if exists activations_creator_all on public.activations;
create policy activations_creator_all on public.activations
  for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists activations_team_read on public.activations;
create policy activations_team_read on public.activations
  for select using (team_id is not null and public.is_team_owner(team_id));

-- checklist_items (inherit access from the parent activation) ------------------
drop policy if exists checklist_creator_all on public.checklist_items;
create policy checklist_creator_all on public.checklist_items
  for all using (
    exists (select 1 from public.activations a
            where a.id = activation_id and a.creator_id = auth.uid())
  ) with check (
    exists (select 1 from public.activations a
            where a.id = activation_id and a.creator_id = auth.uid())
  );

drop policy if exists checklist_team_read on public.checklist_items;
create policy checklist_team_read on public.checklist_items
  for select using (
    exists (select 1 from public.activations a
            where a.id = activation_id and a.team_id is not null
              and public.is_team_owner(a.team_id))
  );

-- notifications ---------------------------------------------------------------
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================================
-- Done. Next: create a Storage bucket named "content" (dashboard → Storage)
-- for captured photos/videos, then wire the app's store to these tables.
-- ============================================================================
