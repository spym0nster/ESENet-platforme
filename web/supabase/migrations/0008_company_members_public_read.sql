-- ESENet — fix: company_members was never publicly readable
--
-- Found live while testing the feed's "Name · Title · Company" rendering
-- (0006_social_posts.sql): company_members has only ever had
-- "company actors see their company's members" (0004), scoped by
-- is_company_actor(). That was fine when the only consumer was the
-- internal /company/team management page, but the feed needs any visitor
-- — a student, another company, a signed-out reader — to read a company
-- member's title to render "Sarah · HR Manager · ABC Digital" next to
-- their posts. Confirmed live: a direct REST select of Company A's
-- company_members row as the QA student returned `[]`, and the feed
-- rendered "Name · Company" with the title silently missing for anyone
-- who wasn't Company A themselves.
--
-- Fix: add a public-read policy, same pattern already used for every other
-- glanceable table in this schema (profiles, companies, student_details,
-- education, experiences, projects, certifications are all `for select
-- using (true)`, write stays owner/actor-scoped). Nothing in this table is
-- sensitive — company_id, profile_id, role, title, created_at — so this
-- matches the app's existing public-read/owner-write model rather than
-- being a special case. company_invites (which does hold emails) is a
-- separate table with its own, still-restricted policies — untouched here.
--
-- Purely additive: SELECT policies OR together, so this can only widen who
-- can see a row, never narrow it or interact badly with the existing
-- policy the way UPDATE/INSERT WITH CHECK combinations can.

create policy "company members are publicly readable" on company_members for select
  using (true);
