-- ESENet — Phase 3 audit fix: missing indexes on high-traffic foreign keys
--
-- Postgres never auto-indexes a foreign key column just because it's a FK
-- — only the table's own primary key gets one automatically. Invisible at
-- QA-fixture scale (a handful of rows), but every one of these columns is
-- filtered on by a real page or RLS policy that will run constantly once
-- real data volume shows up: a company's "my opportunities"/"my
-- applications" views, a student's "my applications", every
-- is_company_actor() call, and the company-invite/first-login lookup by
-- email that runs on every single company-role sign-in.
--
-- A composite primary key already covers its own leftmost column for free
-- (e.g. company_members' PK on (company_id, profile_id) already indexes
-- company_id; saved_opportunities' PK already indexes student_id;
-- applications' unique(opportunity_id, student_id) already indexes
-- opportunity_id) — those are deliberately NOT repeated here. This
-- migration only adds indexes for columns with no existing index at all.
--
-- ADDITIVE, zero behavior change — indexes only affect query planning.

create index if not exists opportunities_company_idx
  on opportunities (company_id);

create index if not exists applications_student_idx
  on applications (student_id);

create index if not exists company_members_profile_idx
  on company_members (profile_id);

create index if not exists post_likes_profile_idx
  on post_likes (profile_id);

create index if not exists company_invites_company_idx
  on company_invites (company_id);

-- Looked up by email on every company-role first login (provisionProfile
-- in actions/auth.ts) and by the "request to join" flow's onboarding
-- redirect check — a plain equality filter with zero index support today.
create index if not exists company_invites_email_idx
  on company_invites (email);

create index if not exists saved_opportunities_opportunity_idx
  on saved_opportunities (opportunity_id);
