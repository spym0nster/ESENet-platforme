-- ESENet — feature: request to join an existing company
--
-- Phase 3 audit (finding Q) flagged the highest-ranked product risk in the
-- platform: company signup unconditionally auto-creates a brand-new company
-- for the signing-up person (provisionProfile() in actions/auth.ts). There
-- was no way for a second employee at a real company — say Sarah at "ABC
-- Digital", which a colleague already registered — to attach herself to the
-- existing company instead of accidentally creating a duplicate "ABC
-- Digital" record. The only existing path into an existing company was a
-- company_invites row the company itself created first (0004); there was no
-- reverse direction where the *person* initiates.
--
-- This migration adds that reverse direction: company_join_requests. A
-- company-role profile with no company yet can request to join one; any
-- actor of the target company can approve or decline it. Approval is a
-- separate, explicit company_members INSERT policy (below) — a join
-- request being 'approved' is what authorizes the membership row, mirroring
-- how company_invites' accepted_at authorizes the invite-acceptance
-- membership insert policy in 0004.
--
-- ADDITIVE ONLY. Existing QA fixtures (Company A/B, the student) already
-- have their companies/company_members rows from before this feature
-- exists and never re-run provisionProfile() (guarded by "if
-- (!existingProfile)" in signIn) — this migration cannot affect them.

create table if not exists company_join_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (profile_id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  message text check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references profiles (id)
);

-- One pending request per (company, person) at a time — resubmitting after
-- a decline is fine (a new row), spamming the same company while already
-- pending is not.
create unique index if not exists company_join_requests_pending_unique_idx
  on company_join_requests (company_id, profile_id)
  where status = 'pending';

create index if not exists company_join_requests_company_idx
  on company_join_requests (company_id);
create index if not exists company_join_requests_profile_idx
  on company_join_requests (profile_id);

-- company_id/profile_id/requested_at are the request's identity — never
-- editable by anyone, including the acting company, after creation. Only
-- status/decided_at/decided_by (the decision) can change, and only a
-- company actor of that company can change them — same
-- "RLS restricts rows, a trigger restricts columns" shape as every other
-- moderation-style table in this schema (protect_post_admin_fields,
-- protect_comment_admin_fields, protect_company_member_identity).
create or replace function protect_join_request_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.company_id := old.company_id;
    new.profile_id := old.profile_id;
    new.requested_at := old.requested_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_join_request_identity_trigger on company_join_requests;
create trigger protect_join_request_identity_trigger
before update on company_join_requests
for each row
execute function protect_join_request_identity();

alter table company_join_requests enable row level security;

create policy "a person requests to join for themselves only" on company_join_requests for insert
  with check (profile_id = auth.uid());

create policy "requester sees their own request" on company_join_requests for select
  using (profile_id = auth.uid());
create policy "company actors see requests to their company" on company_join_requests for select
  using (is_company_actor(company_id));

-- Approve/decline. Same actor level as "company actors can invite to their
-- own company" (0004) — any team member, not owner-only — since approving
-- a request is no more privileged than sending an invite that gets
-- accepted, which any actor can already do.
create policy "company actors decide on requests to their company" on company_join_requests for update
  using (is_company_actor(company_id))
  with check (is_company_actor(company_id));

-- A pending request is the requester's own to withdraw. Once decided
-- (approved/declined) it's the company's decision record, not a personal
-- draft — it stays for history rather than being deletable at that point.
create policy "requester cancels their own pending request" on company_join_requests for delete
  using (profile_id = auth.uid() and status = 'pending');

-- The reverse-direction counterpart to 0004's "an invited user can accept
-- their own invite". Unlike that one, this insert is done by the *company*
-- actor's session at the moment they approve, not the requester's — an
-- approval should take effect immediately (visible in the team list right
-- away), not wait for the requester to next load a page. That's safe
-- because it isn't the company unilaterally naming someone their member:
-- the row can only be inserted for a profile_id that already has an
-- 'approved' company_join_requests row for this exact company, and that
-- request only exists because the person themselves created it
-- (profile_id = auth.uid() was required at request-insert time above) —
-- mutual consent, just captured as two separate writes instead of one.
create policy "company actors add a member from an approved join request" on company_members for insert
  with check (
    is_company_actor(company_id)
    and role = 'member'
    and exists (
      select 1 from company_join_requests
      where company_join_requests.company_id = company_members.company_id
        and company_join_requests.profile_id = company_members.profile_id
        and company_join_requests.status = 'approved'
    )
  );
