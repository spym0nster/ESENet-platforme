-- ESENet — admin read access to the marketplace tables
--
-- The admin surfaces so far (/admin/companies, /admin/reports) only touch
-- tables admins could already read: companies (public) and content_reports
-- ("admins see all reports", 0006). There's no way for an admin to see how
-- the marketplace itself is doing — opportunities are only visible to them
-- when published AND from a verified company (0002), and applications have
-- no admin read policy at all (noted in web/docs/QA.md). This adds a
-- read-only admin view over both, plus application_status_events, so the
-- /admin overview can show real numbers.
--
-- SELECT only. Admins still cannot create/edit/delete opportunities or
-- applications — moderation stays exactly where it already is. RLS SELECT
-- policies are OR'd, so these are purely additive: a non-admin still sees
-- only what the existing public/owner policies allow.
--
-- ADDITIVE ONLY.

create policy "admins read all opportunities" on opportunities for select
  using (is_admin());

create policy "admins read all applications" on applications for select
  using (is_admin());

create policy "admins read all application status events" on application_status_events for select
  using (is_admin());
