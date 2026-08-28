-- ESENet — optional application deadline on an opportunity (0022)
--
-- A company can set a date after which students can no longer apply. The
-- opportunity stays visible in the marketplace (so students can still see
-- what was offered and read the company page) but the apply form is
-- replaced with a "closed" notice, and applyToOpportunity rejects a late
-- submission server-side as defence in depth.
--
-- Purely additive: one nullable date column on `opportunities`. No RLS
-- policy is added or changed — the existing browse/owner policies already
-- cover reads and writes of this column, and "can this student apply" is
-- enforced by the applications INSERT policy + the server action, not by a
-- policy on opportunities.
--
-- ADDITIVE ONLY. NOT security-sensitive (no policy / auth / permission change).

alter table opportunities
  add column if not exists application_deadline date;
