-- ESENet — fix: company_join_requests insert wasn't role-restricted at RLS
--
-- Found live while testing 0009: the insert policy only checked
-- profile_id = auth.uid(), never that the requester is actually a
-- company-role profile. The app's requestToJoinCompany() action already
-- enforces that (via requireUnattachedCompanyUser), but per this project's
-- own established pattern — "Only a student-role account can create an
-- application... independently enforced by RLS" in QA.md — a role
-- restriction like this belongs at the RLS layer too, not just in app
-- code. Confirmed live: a direct REST insert as the QA student succeeded
-- and created a real row before this fix.
--
-- Practical impact was inert either way — every consumer of
-- company_members (requireCompanyUser, requireCompanyActor, resolveCompanyId)
-- already gates on profiles.role = 'company' independently upstream, so a
-- stray request or membership row tied to a student profile could never
-- reach a company page — but "never rely on frontend restrictions" means
-- closing it properly rather than leaving it as a theoretical gap.
--
-- ADDITIVE: replaces one policy's definition, doesn't touch data or any
-- other policy.

drop policy if exists "a person requests to join for themselves only" on company_join_requests;

create policy "a company-role person requests to join for themselves only" on company_join_requests for insert
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'company'
    )
  );
