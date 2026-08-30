-- Draft activations created from linked email.
-- Email-suggested activations land as drafts the member reviews & confirms;
-- manual ones stay confirmed. source_ref stores the Gmail message id so a
-- re-sync never duplicates the same email.

alter table public.activations
  add column if not exists source     text not null default 'manual',   -- 'manual' | 'email'
  add column if not exists is_draft   boolean not null default false,
  add column if not exists source_ref text;                             -- provider message id

-- One activation per source email, per creator.
create unique index if not exists activations_source_ref_uniq
  on public.activations (creator_id, source_ref)
  where source_ref is not null;
