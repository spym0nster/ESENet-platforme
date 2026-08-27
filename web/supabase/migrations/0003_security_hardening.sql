-- ESENet — Critical security hardening
--
-- Two real, live-verified privilege-escalation bugs, both caused by the same
-- root pattern: a "manage my own row" RLS policy grants write access to
-- EVERY column on that row, including sensitive ones RLS's row-level model
-- can't restrict on its own. Row-level security policies cannot express
-- "this column only, unless you're an admin" — that needs a trigger.
--
-- Bug 1 (confirmed live): any authenticated user could PATCH their own
--   profiles.role to 'admin' directly via the REST API, bypassing the app
--   entirely, then use that to reach /admin/companies and verify any
--   company at will.
-- Bug 2 (confirmed live): any company could PATCH their own companies.verified
--   to true directly via the REST API, bypassing admin approval entirely.
--
-- ADDITIVE ONLY — no table/column/data is dropped.

-- =========================================================
-- Protect profiles.role: only an existing admin (or a trusted
-- operator running raw SQL, auth.uid() is null in that context)
-- may set a row's role to 'admin', on insert or update.
-- =========================================================
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
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on profiles;
create trigger protect_profile_role_trigger
before insert or update on profiles
for each row
execute function protect_profile_role();

-- =========================================================
-- Protect companies.verified: only an existing admin may set it
-- to true, on insert or update.
-- =========================================================
create or replace function protect_company_verified()
returns trigger
language plpgsql
as $$
declare
  actor_is_admin boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ) into actor_is_admin;

  if tg_op = 'INSERT' then
    if new.verified = true and not actor_is_admin then
      new.verified := false;
    end if;
    return new;
  end if;

  if new.verified is distinct from old.verified and not actor_is_admin then
    new.verified := old.verified;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_company_verified_trigger on companies;
create trigger protect_company_verified_trigger
before insert or update on companies
for each row
execute function protect_company_verified();

-- =========================================================
-- Bug 3 (found during Phase 5 testing): the "students create
-- their own applications" policy only checked student_id = auth.uid(),
-- not that the actor's profile.role is actually 'student' — a company
-- or admin account could insert an application row for itself. Restrict
-- application creation to profiles that are genuinely students.
-- =========================================================
drop policy if exists "students create their own applications" on applications;
create policy "students create their own applications" on applications for insert
  with check (
    student_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'student')
  );
