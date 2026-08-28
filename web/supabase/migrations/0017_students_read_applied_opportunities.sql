-- ESENet — a student can always read an opportunity they applied to
--
-- Opportunities are now closable by the company (dashboard "Close" button).
-- A closed opportunity no longer matches the public SELECT policy
-- ("published from a verified company", 0002), which is correct for the
-- marketplace — but it also meant a student who had already applied lost
-- all visibility into what they applied to: /applications would render
-- "Opportunity" / "ESEN partner company" placeholders once the row went
-- dark.
--
-- This adds a narrow extra SELECT path: you can read an opportunity if you
-- have an application to it. RLS SELECT policies are OR'd, so this is
-- purely additive.
--
-- Done through a SECURITY DEFINER function, NOT an inline `exists (select
-- ... from applications ...)`, on purpose: `applications` already has a
-- policy ("companies read applications to their opportunities") that
-- sub-queries `opportunities`, so an inline cross-reference here would set
-- up mutual opportunities<->applications policy recursion. Running the
-- lookup as the function owner (search_path pinned) sidesteps applications'
-- RLS entirely — same shape as is_company_actor() / is_admin().
--
-- ADDITIVE ONLY.

create or replace function has_application_to(opp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from applications
    where applications.opportunity_id = opp_id
      and applications.student_id = auth.uid()
  );
$$;

create policy "students read opportunities they applied to" on opportunities for select
  using (has_application_to(id));
