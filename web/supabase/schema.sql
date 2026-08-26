-- ESENet — Phase 1 schema (Opportunities: internships + PFE)
-- Run this once in the Supabase SQL editor for a fresh project.

-- ---------- enums ----------
create type user_role as enum ('student', 'company', 'admin');
create type opportunity_type as enum ('internship', 'pfe', 'job', 'alternance', 'freelance');
create type opportunity_status as enum ('pending', 'published', 'closed');
create type application_status as enum ('applied', 'reviewed', 'accepted', 'rejected');

-- ---------- profiles (one row per auth user, any role) ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- student-only details ----------
create table student_details (
  profile_id uuid primary key references profiles (id) on delete cascade,
  headline text,
  bio text,
  skills text[] not null default '{}',
  looking_for text,
  availability date,
  cv_url text,
  linkedin_url text
);

-- ---------- company-only details ----------
create table companies (
  profile_id uuid primary key references profiles (id) on delete cascade,
  company_name text not null,
  website text,
  logo_url text,
  description text,
  verified boolean not null default false
);

-- ---------- opportunities, posted by companies ----------
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (profile_id) on delete cascade,
  type opportunity_type not null,
  title text not null,
  description text not null,
  skills text[] not null default '{}',
  location text,
  remote boolean not null default false,
  start_date date,
  end_date date,
  status opportunity_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- applications, submitted by students ----------
create table applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  status application_status not null default 'applied',
  message text,
  created_at timestamptz not null default now(),
  unique (opportunity_id, student_id)
);

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table student_details enable row level security;
alter table companies enable row level security;
alter table opportunities enable row level security;
alter table applications enable row level security;

-- profiles: public directory read, owner-only write
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users manage their own profile" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- student_details: public read (for company search), owner-only write
create policy "student details are publicly readable" on student_details for select using (true);
create policy "students manage their own details" on student_details for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- companies: public read, owner-only write
create policy "companies are publicly readable" on companies for select using (true);
create policy "companies manage their own record" on companies for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- opportunities: published ones are public; a company sees/edits its own regardless of status
create policy "published opportunities are publicly readable" on opportunities for select
  using (status = 'published' or company_id = auth.uid());
create policy "companies manage their own opportunities" on opportunities for insert
  with check (company_id = auth.uid());
create policy "companies update their own opportunities" on opportunities for update
  using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "companies delete their own opportunities" on opportunities for delete
  using (company_id = auth.uid());

-- applications: a student sees/creates their own; a company sees applications to its own opportunities
create policy "students manage their own applications" on applications for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "companies read applications to their opportunities" on applications for select
  using (
    exists (
      select 1 from opportunities
      where opportunities.id = applications.opportunity_id
        and opportunities.company_id = auth.uid()
    )
  );
create policy "companies update status of applications to their opportunities" on applications for update
  using (
    exists (
      select 1 from opportunities
      where opportunities.id = applications.opportunity_id
        and opportunities.company_id = auth.uid()
    )
  );
