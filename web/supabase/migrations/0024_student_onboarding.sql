-- ESENet — stepped student onboarding (0024)
--
-- Backs the /onboarding flow (see web/docs/ONBOARDING.md). Three new
-- columns, one trigger, one backfill. Rulings that shaped this are in
-- ONBOARDING.md §9.
--
--   student_details.goal_types   — the opportunity types a student is after
--                                  (Goals step). Plain text[] like `skills`,
--                                  app-validated against
--                                  {internship,pfe,job,alternance}.
--   student_details.onboarded_at — the finish-line marker. Null until the
--                                  student completes the last required step.
--                                  Gates: appearing in /students, and
--                                  applying to an opportunity.
--   education.graduation_year    — "graduation year (or expected)" from the
--                                  Education step. A real year, not a faked
--                                  end_date.
--
-- No new RLS policy: all three columns inherit their table's existing
-- policies (student_details: public read + owner-only write; education:
-- same). The columns are not security-sensitive on their own — the gate is
-- enforced by the /students queries and the applyToOpportunity server
-- action reading `onboarded_at`, plus the RLS that already exists on
-- `applications`.
--
-- ADDITIVE: `add column if not exists` + a new BEFORE UPDATE trigger. No
-- column or row is dropped. Safe to re-run.

-- ---------- 1. columns ----------

alter table student_details
  add column if not exists goal_types text[] not null default '{}';

alter table student_details
  add column if not exists onboarded_at timestamptz;

alter table education
  add column if not exists graduation_year smallint;

-- ---------- 2. onboarded_at can't be un-set ----------
--
-- student_details rows are owner-writable, so without this a student could
-- clear their own `onboarded_at` (or, via crafted REST, set it early and
-- later blank it). Once it holds a timestamp it's frozen — you can't
-- "un-onboard". Same "old.X is not null -> freeze X" shape as the
-- deactivated_at guard in 0013. A trusted context that genuinely needs to
-- reset it can `alter table student_details disable trigger
-- student_details_freeze_onboarded_at` for the statement.

create or replace function protect_student_onboarded_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.onboarded_at is not null then
    new.onboarded_at := old.onboarded_at;
  end if;
  return new;
end;
$$;

drop trigger if exists student_details_freeze_onboarded_at on student_details;
create trigger student_details_freeze_onboarded_at
  before update on student_details
  for each row
  execute function protect_student_onboarded_at();

-- ---------- 3. backfill ----------
--
-- Existing students who already have a started profile must not vanish from
-- /students when the directory switches to `onboarded_at IS NOT NULL`. This
-- is exactly the predicate fetchStudents uses today (headline OR bio OR any
-- skill), so everyone currently listed stays listed. Runs once; the guard
-- above then freezes the stamp.

update student_details
set onboarded_at = now()
where onboarded_at is null
  and (headline is not null or bio is not null or skills <> '{}');
