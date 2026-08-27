-- ============================================================================
-- ONSITE — let teammates see each other's profiles (names in the roster).
-- Without this, an owner can read team_members rows but not the joined
-- profile, so the roster shows nobody. Run after the earlier migrations.
-- ============================================================================

-- SECURITY DEFINER so its lookups bypass RLS (avoids recursion).
create or replace function public.can_view_profile(p uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p = auth.uid()                                   -- your own profile
    or exists (                                      -- p is a member of a team you own
      select 1 from team_members tm
      join teams t on t.id = tm.team_id
      where tm.profile_id = p and t.owner_id = auth.uid()
    )
    or exists (                                      -- you are a member of a team p owns
      select 1 from teams t
      join team_members tm on tm.team_id = t.id
      where t.owner_id = p and tm.profile_id = auth.uid() and tm.status = 'approved'
    )
    or exists (                                      -- p and you share a team
      select 1 from team_members a
      join team_members b on a.team_id = b.team_id
      where a.profile_id = auth.uid() and b.profile_id = p
        and a.status = 'approved' and b.status = 'approved'
    );
$$;

-- Replace the own-only select policy with the team-aware one.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
  for select using (public.can_view_profile(id));

-- (insert/update own-row policies stay as defined in schema.sql.)
-- ============================================================================
-- Done. Owners now see their members' names in the roster.
-- ============================================================================
