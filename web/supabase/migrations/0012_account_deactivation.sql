-- ESENet — account deletion (Phase 3 audit item 8: account lifecycle)
--
-- profiles.id IS auth.users.id (the primary key doubles as the FK), so the
-- two rows can never be split apart — deleting the auth.users row cascades
-- and destroys the profiles row too, which would then cascade further into
-- everything that references profiles.id: a comment thread where someone
-- replied to this person, a company's own hiring record of their
-- application, a post other people liked. Hard-deleting the account would
-- make those OTHER people's records collateral damage, not just the
-- deleting user's own data.
--
-- So this is an anonymize-and-deactivate model, not a hard delete: the
-- profiles row survives as a tombstone (full_name becomes "Deleted user",
-- avatar/banner cleared) so existing comments/applications/posts still
-- render correctly for whoever legitimately holds them, while everything
-- purely personal — CV, education/experience/projects/certifications, saved
-- opportunities, bio/skills — actually gets removed. See
-- src/app/actions/account.ts for the actual procedure; this migration only
-- adds what that action needs: a one-way "deactivated" marker, and letting
-- a company member remove themselves (not just be removed by the owner).
--
-- ADDITIVE ONLY.

alter table profiles add column if not exists deactivated_at timestamptz;

-- Extends protect_profile_role (0003) rather than adding a second trigger
-- on the same table for a closely related "this field, once set, is
-- final" concern. Once deactivated_at is set, nothing (not even an admin)
-- can clear or change it through the API — reactivating an anonymized,
-- data-stripped account isn't a real "undo", so there's no case where
-- un-setting it should be allowed at all, unlike role (admin-settable) or
-- verified (admin-settable). The user can still set it themselves the
-- first time (null -> now()) — that's the actual self-deletion action.
create or replace function protect_profile_role()
returns trigger
language plpgsql
as $$
declare
  actor_is_admin boolean;
begin
  if auth.uid() is null then
    return new; -- trusted server-side/SQL-editor context, not a PostgREST request
  end if;

  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ) into actor_is_admin;

  if tg_op = 'INSERT' then
    if new.role = 'admin' and not actor_is_admin then
      new.role := 'student';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role and not actor_is_admin then
    new.role := old.role;
  end if;
  if old.deactivated_at is not null then
    new.deactivated_at := old.deactivated_at;
  end if;
  return new;
end;
$$;

-- The reverse-direction counterpart to "company owner can remove a member"
-- (0004) — a member has never been able to remove themselves, only be
-- removed by the owner. Deliberately role = 'member' only, same as the
-- owner-initiated version: an owner can't "leave" through this path — see
-- actions/account.ts's comment on why ownership transfer isn't shipped
-- yet.
create policy "a member can remove themselves" on company_members for delete
  using (profile_id = auth.uid() and role = 'member');
