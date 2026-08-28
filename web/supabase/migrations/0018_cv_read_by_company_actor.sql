-- ESENet — CV read access follows is_company_actor, not owner-only (0018)
--
-- The original "companies read cvs of their applicants" policy (0002)
-- checked opportunities.company_id = auth.uid() — i.e. only the company
-- OWNER. Under the multi-user company model (0004) a team member's
-- auth.uid() != company_id, so an invited HR/recruiter reviewing
-- applicants silently couldn't open any applicant's CV. This is the same
-- owner->actor transition 0004 already made for every other
-- company-scoped policy.
--
-- is_company_actor() is SECURITY DEFINER, so there's no
-- storage.objects <-> applications policy recursion.
--
-- Same intent as before, wider (correct) set of readers.

drop policy if exists "companies read cvs of their applicants" on storage.objects;

create policy "companies read cvs of their applicants" on storage.objects for select
  using (
    bucket_id = 'cvs'
    and exists (
      select 1
      from applications
      join opportunities on opportunities.id = applications.opportunity_id
      where applications.student_id::text = (storage.foldername(storage.objects.name))[1]
        and is_company_actor(opportunities.company_id)
    )
  );
