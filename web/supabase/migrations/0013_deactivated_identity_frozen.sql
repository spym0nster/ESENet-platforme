-- ESENet — fix: a deactivated account could still edit its own name/photos
--
-- Found live while testing account deletion (0012): deactivated_at is
-- correctly one-way (the trigger blocks clearing it), but nothing stopped
-- the account from continuing to update full_name/avatar_url/banner_url
-- afterward — confirmed live by logging back in as a just-deleted scratch
-- account and successfully PATCHing full_name back to a real-looking
-- name via direct REST. That defeats the entire point of the "Deleted
-- user" tombstone: anyone could "undelete" their own visible identity
-- immediately after deleting, while their CV/education/etc stay gone.
--
-- Fix: once deactivated_at is already set (i.e. this isn't the deletion
-- update itself, which sets deactivated_at for the first time in the same
-- statement that also sets these fields to their anonymized values), lock
-- full_name/avatar_url/banner_url immutable too — same "old.X is not null
-- -> freeze X" shape already used for deactivated_at itself.
--
-- ADDITIVE: extends protect_profile_role() again, no data changes.

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
    new.full_name := old.full_name;
    new.avatar_url := old.avatar_url;
    new.banner_url := old.banner_url;
  end if;
  return new;
end;
$$;
