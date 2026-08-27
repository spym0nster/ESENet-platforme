-- ESENet — Phase 2 migration
-- Trust/verification enforcement, student profile, applicant status pipeline
-- + history, saved opportunities, CV storage.
--
-- ADDITIVE ONLY. Safe to run against the existing populated database:
-- no table is dropped, no column is dropped, no existing row is deleted.
-- Run once in the Supabase SQL editor, same as schema.sql was.

-- =========================================================
-- 1. Extend application_status (student: Withdrawn: company
--    review flow needs Shortlisted / Interview too)
-- =========================================================
alter type application_status add value if not exists 'shortlisted';
alter type application_status add value if not exists 'interview';
alter type application_status add value if not exists 'withdrawn';
-- existing values kept: applied, reviewed, accepted, rejected

-- =========================================================
-- 2. Tighten applications RLS: a student could previously set
--    their OWN application to any status (e.g. "accepted") via
--    the original blanket "for all" policy. Split into narrow
--    policies: students may only ever move their own application
--    to 'withdrawn'; companies may set anything except 'withdrawn'
--    on applications to their own opportunities.
-- =========================================================
drop policy if exists "students manage their own applications" on applications;
drop policy if exists "companies update status of applications to their opportunities" on applications;

create policy "students view their own applications" on applications for select
  using (student_id = auth.uid());
create policy "students create their own applications" on applications for insert
  with check (student_id = auth.uid());
create policy "students withdraw their own applications" on applications for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and status = 'withdrawn');
create policy "students delete their own applications" on applications for delete
  using (student_id = auth.uid());

create policy "companies update status of applications to their opportunities" on applications for update
  using (
    exists (
      select 1 from opportunities
      where opportunities.id = applications.opportunity_id
        and opportunities.company_id = auth.uid()
    )
  )
  with check (status <> 'withdrawn');

-- =========================================================
-- 3. Application status history — append-only audit trail,
--    queryable from day one even before a reporting UI exists.
-- =========================================================
create table if not exists application_status_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  status application_status not null,
  changed_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table application_status_events enable row level security;

create policy "students see history of their own applications" on application_status_events for select
  using (
    exists (
      select 1 from applications
      where applications.id = application_status_events.application_id
        and applications.student_id = auth.uid()
    )
  );
create policy "companies see history of applications to their opportunities" on application_status_events for select
  using (
    exists (
      select 1 from applications
      join opportunities on opportunities.id = applications.opportunity_id
      where applications.id = application_status_events.application_id
        and opportunities.company_id = auth.uid()
    )
  );
create policy "students log their own withdrawal" on application_status_events for insert
  with check (
    changed_by = auth.uid()
    and status = 'withdrawn'
    and exists (
      select 1 from applications
      where applications.id = application_id and applications.student_id = auth.uid()
    )
  );
create policy "companies log status changes on their opportunities applications" on application_status_events for insert
  with check (
    changed_by = auth.uid()
    and status <> 'withdrawn'
    and exists (
      select 1 from applications
      join opportunities on opportunities.id = applications.opportunity_id
      where applications.id = application_id and opportunities.company_id = auth.uid()
    )
  );

-- =========================================================
-- 4. Company verification enforcement — the `verified` column
--    already existed but nothing read or enforced it. From now
--    on, a published opportunity is only publicly visible if its
--    owning company is verified. Companies always still see their
--    own opportunities regardless of verification status.
-- =========================================================
drop policy if exists "published opportunities are publicly readable" on opportunities;
create policy "published opportunities from verified companies are publicly readable" on opportunities for select
  using (
    (
      status = 'published'
      and exists (
        select 1 from companies
        where companies.profile_id = opportunities.company_id and companies.verified = true
      )
    )
    or company_id = auth.uid()
  );

-- Only an admin (profiles.role = 'admin') may flip a company's verified flag.
-- Companies keep their existing self-service policy for their own non-verification fields.
create policy "admins verify companies" on companies for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- =========================================================
-- 5. Preserve the verified QA marketplace-loop baseline.
--    Company A's fixture opportunity must stay publicly visible
--    now that visibility requires verification. Company B is
--    deliberately left unverified — it becomes the first real
--    test case for the new admin-approval screen.
-- =========================================================
update companies set verified = true where profile_id = '526a6b6c-76ad-4a28-89ee-dd65d672bd14';

-- =========================================================
-- 6. Student profile: education / experience / projects / certifications
--    (1:many under student_details, same ownership pattern as it)
-- =========================================================
create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_details (profile_id) on delete cascade,
  school text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_details (profile_id) on delete cascade,
  title text not null,
  organization text,
  description text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_details (profile_id) on delete cascade,
  title text not null,
  description text,
  url text,
  created_at timestamptz not null default now()
);

create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_details (profile_id) on delete cascade,
  name text not null,
  issuer text,
  issue_date date,
  created_at timestamptz not null default now()
);

alter table education enable row level security;
alter table experiences enable row level security;
alter table projects enable row level security;
alter table certifications enable row level security;

create policy "education is publicly readable" on education for select using (true);
create policy "students manage their own education" on education for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "experiences are publicly readable" on experiences for select using (true);
create policy "students manage their own experiences" on experiences for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "projects are publicly readable" on projects for select using (true);
create policy "students manage their own projects" on projects for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "certifications are publicly readable" on certifications for select using (true);
create policy "students manage their own certifications" on certifications for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- =========================================================
-- 7. Saved opportunities
-- =========================================================
create table if not exists saved_opportunities (
  student_id uuid not null references profiles (id) on delete cascade,
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, opportunity_id)
);

alter table saved_opportunities enable row level security;
create policy "students manage their own saved opportunities" on saved_opportunities for all
  using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- =========================================================
-- 8. CV storage — private bucket, path convention cvs/<student_id>/<file>
-- =========================================================
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "students upload their own cv" on storage.objects for insert
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "students manage their own cv" on storage.objects for all
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "companies read cvs of their applicants" on storage.objects for select
  using (
    bucket_id = 'cvs'
    and exists (
      select 1 from applications
      join opportunities on opportunities.id = applications.opportunity_id
      where applications.student_id::text = (storage.foldername(name))[1]
        and opportunities.company_id = auth.uid()
    )
  );

-- =========================================================
-- 9. Helpful indexes for the upcoming search/discovery phase
--    (plain btree/GIN on existing columns — no new columns).
-- =========================================================
create index if not exists opportunities_type_idx on opportunities (type);
create index if not exists opportunities_location_idx on opportunities (location);
create index if not exists opportunities_skills_gin_idx on opportunities using gin (skills);
