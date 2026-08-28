-- ESENet — fix: company_members never had an UPDATE policy
--
-- Found live while testing the new "your title at this company" feature
-- (0006_social_posts.sql's company_members.title column): with RLS enabled
-- and no permissive UPDATE policy at all, Postgres default-denies every row
-- — but PostgREST reports that as a normal 0-row response (`error: null`),
-- not a failure. updateMyTitle() in actions/company-team.ts therefore
-- returned `{ success: true }` while writing nothing, and the UI showed
-- "Saved ✓" for a save that never happened. Confirmed live: the feed showed
-- "Name · Company" with the title missing between them even after "saving"
-- it, and a direct re-select of the row showed title still null.
--
-- Fix: let a member update their own row, but lock company_id/profile_id/
-- role immutable via trigger — same "RLS restricts rows, a trigger
-- restricts columns" pattern as protect_profile_role/protect_company_verified
-- (0003) and protect_post_admin_fields (0006). Nobody should be able to
-- reassign their own membership to a different company or promote
-- themselves to owner through this path.
--
-- ADDITIVE ONLY.

create or replace function protect_company_member_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.company_id := old.company_id;
    new.profile_id := old.profile_id;
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_company_member_identity_trigger on company_members;
create trigger protect_company_member_identity_trigger
before update on company_members
for each row
execute function protect_company_member_identity();

create policy "members update their own membership row" on company_members for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
