-- Brand review via shareable magic link.
-- Each activation can mint a secret review token. A brand opens
--   /functions/v1/brand-review?token=<token>
-- in any browser (no login) to view delivered items and approve / request
-- changes. The token is an unguessable secret; the creator generates it with
-- a normal authenticated update (RLS already lets a creator update their own
-- activation), and the public Edge Function resolves token -> activation with
-- the service role, so no RLS is opened to anon.

alter table public.activations
  add column if not exists review_token uuid;

-- One token -> one activation. Partial unique so the many NULLs don't collide.
create unique index if not exists activations_review_token_uniq
  on public.activations (review_token)
  where review_token is not null;
