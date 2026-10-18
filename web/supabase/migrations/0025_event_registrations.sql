-- ESENet — Talent Fair 2026 registrations (0025)
--
-- Backs the public event site (event/): visitor passes and free exhibitor
-- stands. Written ONLY by the event site's server actions with the service
-- role key, so RLS is enabled with no policies: anon and authenticated
-- users cannot read or write these tables directly.
--
--   event_visitors    — one row per visitor pass (QR code = `code`)
--   event_exhibitors  — one row per company applying for a free stand
--   event_exhibitor_people — the 2 people (name + post) coming with it
--   storage bucket `event-logos` — public read, written by the server only

create table public.event_visitors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  full_name text not null,
  email text not null,
  phone text,
  status text not null default 'student'
    check (status in ('student', 'graduate', 'professional', 'other')),
  school text,
  field text,
  wants_cv boolean not null default false,
  cv_path text,
  consent_data boolean not null,
  consent_cv boolean not null default false,
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email)
);

create table public.event_exhibitors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  company_name text not null,
  sector text,
  website text,
  description text,
  logo_url text,
  hiring_types text[] not null default '{}',
  needs text,
  contact_email text not null,
  contact_phone text,
  sponsor_interest text check (sponsor_interest in ('bronze', 'silver', 'gold', 'platinum')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  stand_number text,
  consent_data boolean not null,
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  created_at timestamptz not null default now()
);

create table public.event_exhibitor_people (
  id uuid primary key default gen_random_uuid(),
  exhibitor_id uuid not null references public.event_exhibitors (id) on delete cascade,
  full_name text not null,
  job_title text not null,
  code text not null unique,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create index event_exhibitor_people_exhibitor_idx on public.event_exhibitor_people (exhibitor_id);

alter table public.event_visitors enable row level security;
alter table public.event_exhibitors enable row level security;
alter table public.event_exhibitor_people enable row level security;

insert into storage.buckets (id, name, public)
values ('event-logos', 'event-logos', true)
on conflict (id) do nothing;

-- Optional CVs shared by visitors who tick the CV-sharing consent. Private.
insert into storage.buckets (id, name, public)
values ('event-cvs', 'event-cvs', false)
on conflict (id) do nothing;
