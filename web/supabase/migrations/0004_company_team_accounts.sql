-- ESENet — Multi-user company accounts
--
-- Lets more than one person (HR, a hiring/project manager, etc.) act for the
-- same company, without changing what `company_id` means anywhere in the
-- existing schema. `companies.profile_id` stays the company's permanent
-- identity (unchanged FK everywhere); we just add a membership layer on top
-- of it, plus an email-invite flow to add members. ADDITIVE ONLY.

-- =========================================================
-- 1. Membership + invite tables
-- =========================================================
create table if not exists company_members (
  company_id uuid not null references companies (profile_id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

create table if not exists company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (profile_id) on delete cascade,
  email text not null,
  invited_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table company_members enable row level security;
alter table company_invites enable row level security;

-- =========================================================
-- 2. is_company_actor(): true if the authenticated user owns or is a
--    member of the given company. One place to define "can this user act
--    for this company", reused across every RLS policy below instead of
--    repeating the same exists() subquery everywhere.
-- =========================================================
-- SECURITY DEFINER is required here, not just a safe default: this function
-- is used inside a SELECT policy ON company_members itself. If it ran as
-- SECURITY INVOKER, its internal "select from company_members" would
-- re-trigger that same SELECT policy, which calls this function again —
-- infinite recursion (confirmed live: Postgres actually hit "stack depth
-- limit exceeded" before this was fixed). DEFINER makes the internal query
-- bypass RLS instead of re-entering it. It only ever returns a boolean and
-- never exposes row data or write access, so this doesn't broaden what a
-- caller can do — it only fixes how the check evaluates internally.
create or replace function is_company_actor(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    target_company_id = auth.uid()
    or exists (
      select 1 from company_members
      where company_members.company_id = target_company_id
        and company_members.profile_id = auth.uid()
    );
$$;

-- =========================================================
-- 3. company_members RLS
-- =========================================================
create policy "company actors see their company's members" on company_members for select
  using (is_company_actor(company_id));

-- Owner row is created by the owner themselves right after they create the
-- companies row (server-side, same request).
create policy "a company owner can record themselves as owner" on company_members for insert
  with check (
    profile_id = auth.uid()
    and role = 'owner'
    and exists (select 1 from companies where companies.profile_id = company_members.company_id and companies.profile_id = auth.uid())
  );

-- A member row can only ever be created by the invited person themselves,
-- accepting a real pending invite sent to their own (JWT-verified) email —
-- never by a company naming an arbitrary profile_id as its own member.
create policy "an invited user can accept their own invite" on company_members for insert
  with check (
    profile_id = auth.uid()
    and role = 'member'
    and exists (
      select 1 from company_invites
      where company_invites.company_id = company_members.company_id
        and company_invites.email = (auth.jwt() ->> 'email')
        and company_invites.accepted_at is null
    )
  );

create policy "company owner can remove a member" on company_members for delete
  using (
    role = 'member'
    and exists (select 1 from companies where companies.profile_id = company_members.company_id and companies.profile_id = auth.uid())
  );

-- =========================================================
-- 4. company_invites RLS
-- =========================================================
create policy "company actors see their company's invites" on company_invites for select
  using (is_company_actor(company_id));

-- Without this, an invited user has no way to even see the invite
-- addressed to them before they've accepted it (they aren't a company
-- actor yet — that's exactly what accepting the invite is for), so the
-- provisioning code's "do I have a pending invite?" lookup would silently
-- see nothing and fall through to creating a new company instead.
create policy "invited user can see invites addressed to their own email" on company_invites for select
  using (email = (auth.jwt() ->> 'email'));

create policy "company actors can invite to their own company" on company_invites for insert
  with check (invited_by = auth.uid() and is_company_actor(company_id));

create policy "invited user can accept their own invite" on company_invites for update
  using (email = (auth.jwt() ->> 'email') and accepted_at is null)
  with check (email = (auth.jwt() ->> 'email'));

create policy "company actors can cancel a pending invite" on company_invites for delete
  using (is_company_actor(company_id) and accepted_at is null);

-- =========================================================
-- 5. Extend existing opportunities/applications/companies policies so a
--    company MEMBER can do everything the owner already could. Every
--    "company_id = auth.uid()" check becomes "is_company_actor(company_id)"
--    — strictly broader, never narrower, so nothing that worked before
--    stops working.
-- =========================================================
drop policy if exists "published opportunities from verified companies are publicly readable" on opportunities;
create policy "published opportunities from verified companies are publicly readable" on opportunities for select
  using (
    (
      status = 'published'
      and exists (
        select 1 from companies
        where companies.profile_id = opportunities.company_id and companies.verified = true
      )
    )
    or is_company_actor(company_id)
  );

drop policy if exists "companies manage their own opportunities" on opportunities;
create policy "companies manage their own opportunities" on opportunities for insert
  with check (is_company_actor(company_id));

drop policy if exists "companies update their own opportunities" on opportunities;
create policy "companies update their own opportunities" on opportunities for update
  using (is_company_actor(company_id)) with check (is_company_actor(company_id));

drop policy if exists "companies delete their own opportunities" on opportunities;
create policy "companies delete their own opportunities" on opportunities for delete
  using (is_company_actor(company_id));

drop policy if exists "companies read applications to their opportunities" on applications;
create policy "companies read applications to their opportunities" on applications for select
  using (
    exists (
      select 1 from opportunities
      where opportunities.id = applications.opportunity_id
        and is_company_actor(opportunities.company_id)
    )
  );

drop policy if exists "companies update status of applications to their opportunities" on applications;
create policy "companies update status of applications to their opportunities" on applications for update
  using (
    exists (
      select 1 from opportunities
      where opportunities.id = applications.opportunity_id
        and is_company_actor(opportunities.company_id)
    )
  )
  with check (
    status <> 'withdrawn'
    and exists (
      select 1 from opportunities
      where opportunities.id = applications.opportunity_id
        and is_company_actor(opportunities.company_id)
    )
  );

drop policy if exists "companies see history of applications to their opportunities" on application_status_events;
create policy "companies see history of applications to their opportunities" on application_status_events for select
  using (
    exists (
      select 1 from applications
      join opportunities on opportunities.id = applications.opportunity_id
      where applications.id = application_status_events.application_id
        and is_company_actor(opportunities.company_id)
    )
  );

drop policy if exists "companies log status changes on their opportunities applications" on application_status_events;
create policy "companies log status changes on their opportunities applications" on application_status_events for insert
  with check (
    changed_by = auth.uid()
    and status <> 'withdrawn'
    and exists (
      select 1 from applications
      join opportunities on opportunities.id = applications.opportunity_id
      where applications.id = application_id
        and is_company_actor(opportunities.company_id)
    )
  );

-- Members can edit the company's own profile fields too (name/website/logo/
-- description) — `verified` stays admin-only regardless, enforced by the
-- protect_company_verified trigger independent of which RLS policy matched.
create policy "company members manage their own company record" on companies for update
  using (is_company_actor(profile_id))
  with check (is_company_actor(profile_id));

-- =========================================================
-- 6. Backfill: give each existing company an explicit 'owner' membership
--    row matching its own profile_id, so the model is uniform going
--    forward (every company, old or new, has at least one company_members
--    row). Purely additive — doesn't change who can already do what.
-- =========================================================
insert into company_members (company_id, profile_id, role)
select profile_id, profile_id, 'owner' from companies
on conflict do nothing;
