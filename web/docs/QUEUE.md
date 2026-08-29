# Work queue — autonomous run

Bilel handed a queue to work through without stopping for approval between
items. This file is the running log. **"Needs Bilel"** collects anything that
would normally need a ruling — he reads it and rules in one pass.

Rules in force: presentation-layer decisions are mine; no new colours/fonts
(tokens only); §8 of `UX_ELEVATION.md` binds; `lint` + `build` clean at every
commit; one commit per item; local only, never push. Work I couldn't run
against seeded data is labelled **traced, not executed**.

---

## Queue status

| # | Item | Status |
|---|---|---|
| 1 | Onboarding spec (`ONBOARDING.md`) | ✅ done — rulings baked in, committed |
| — | Audit findings F3, F4 | ✅ done — committed |
| 2 | Signed-in navigation (avatar menu, role-aware) | ⏳ in progress |
| 3 | Phase 3 item 6 — `/` landing rebuild | ◻ not started |
| 4 | Phase 3 item 7 — the route sweep | ◻ not started |

---

## Needs Bilel

Nothing yet.

---

## Log

### Item 1 — Onboarding spec
`ONBOARDING.md` updated with the six column/gating rulings (§9): `goal_types`
yes, `interests` cut (folded into `looking_for`), `onboarded_at` yes + can't-
un-set trigger, `education.graduation_year smallint` added, `/students`
switches to `onboarded_at IS NOT NULL` with a heuristic backfill, company that
skipped steps 2–4 can still post (§14 closed). Migration file is written when
the feature is built, not now. Spec only — no code.

### Audit — F3, F4
Added to `SECURITY_PERFORMANCE_AUDIT.md`, report-only:
- **F3** — `student_details` (+ child tables) are `SELECT using (true)`; no
  visibility column; a student can't opt out and any authed user can read every
  profile straight from PostgREST. Needs a product decision before real
  students arrive.
- **F4** — `updateStudentProfile` writes all six columns every call, so any
  partial write nulls the rest. Latent today (the one caller sends all fields),
  live bug the moment anything else calls it.
