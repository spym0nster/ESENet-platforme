# ESENet — stepped onboarding (spec)

Status: **spec only, not built.** No code, no migrations, no commits until this
is reviewed. Where this spec would need a schema change, it says so and stops
for a go/no-go (see §9).

---

## 1. Scope check

**Is onboarding Phase 1/2 or deferred?**

It is **not on the deferred list** in `CLAUDE.md`. The deferred set is: alumni
network/messaging, the scored matching engine, QR/event-day companion,
freelance/hackathon/challenge modules. Onboarding is none of those.

It also isn't a *new* capability — it's a re-shaping of data that is already
Phase 1: the student profile, the apply flow, and the `/students` directory are
all "built and live-tested" per `CLAUDE.md`, and the single biggest thing
undermining all three is that a freshly-signed-up student lands on a wall of
empty forms and fills none of them. So onboarding serves Phase 1 goals
directly; it sits in **Phase 1 polish / in-scope**.

**Should it wait?**

My recommendation: **yes, sequence it after UX-elevation items 6 (landing) and
7 (route sweep)** — not because it's out of scope, but because:

1. The landing page (item 6) is the natural on-ramp *to* onboarding. Build
   onboarding first and you build its entry point twice.
2. Item 7 sweeps every route for the primitives, `loading.tsx`, focus rings,
   375px. Five new onboarding routes built now just become five more routes
   item 7 has to revisit.
3. Onboarding needs the dev/seed environment to verify (multi-student,
   varied-profile), and that work is currently mid-blocked.
4. The elevation is a coherent in-flight workstream; interleaving a feature
   fragments both.

If empty profiles are actively blocking the value you need live for Nov 2026 —
i.e. companies show up and there's nobody to look at — it jumps the queue. That
call is yours. This spec is ready either way.

---

## 2. Conflicts with the current code (read this first)

The prompt's assumptions vs. what the repo actually does:

| Prompt says | Reality | Consequence for this spec |
|---|---|---|
| "Profile visibility already exists; onboarding sets that same control, or nothing." | **It does not exist.** No `visible` / `discoverable` / `searchable` / `is_public` column on `student_details` or `profiles`. The only related state is `profiles.deactivated_at` (account deletion, one-way). `student_details` and all its child tables are `select using (true)` — fully public-read. | Onboarding sets **nothing** for visibility. There is no toggle to reuse and none to invent. A student either appears in `/students` (onboarded) or doesn't (not onboarded) — that's the whole model. The reference's "Share my profile with partner companies" toggle is dropped, as instructed. |
| Goals step writes "what they're looking for" | `student_details.looking_for` is a **single free-text column** ("what you're looking for"), not structured. | Goals gets one new `text[]` column (`goal_types`) for the opportunity-type selection (ruled in). Fields-of-interest reuse `looking_for`. |
| "Write through the server actions /profile already uses." | `updateStudentProfile` **overwrites every column it knows about on every call** (`headline`, `bio`, `looking_for`, `availability`, `linkedin_url`, `skills`). An onboarding step that submits only `headline` would null the other five. | `updateStudentProfile` must become a **partial update** (write only keys present in the FormData). `/profile`'s form submits all fields, so its behaviour is unchanged. Flagged in §10. |
| Education is one of the profile actions | `profile-items.ts` has `addProfileItem` (insert) and `deleteProfileItem` — **no update path**. An onboarding Education step that the user revisits would insert a *second* `education` row. | Add a generic `updateProfileItem` to `profile-items.ts` (mirrors add/delete). Also closes a real `/profile` gap — you currently can't edit an education entry, only delete and re-add. Flagged in §10. |
| Onboarding is "required to appear in /students" | `/students` currently lists anyone who is `role='student'`, not deactivated, and has **any one of** `headline` / `bio` / `skills` (`fetchStudents`, `src/lib/students.ts:61`). | Switch the filter to `onboarded_at IS NOT NULL`. Behaviour change to `fetchStudents` and `fetchStudentProfile`. Existing profiles must be backfilled (§8, migration notes) so nobody vanishes. |
| — | `profiles.full_name` is **one field**, set at signup, and no student action updates it (`updateStudentProfile` only touches `student_details`). | The Identity step needs a write path for `profiles.full_name`. Smallest option: let `updateStudentProfile` also accept `full_name` and update `profiles` in the same call. Flagged in §10. |
| — | Post-signup redirect is hard-coded: `signUp` → `/opportunities`, `signIn` → `next || /opportunities` (`src/app/actions/auth.ts`). | New students should land on `/onboarding`. Change: after provisioning, if `role==='student'` and not onboarded → `redirect('/onboarding')` (carrying `next` if present). |
| — | `education` has no graduation-year column — only `start_date` / `end_date` (`date`). | Add `education.graduation_year smallint` (ruled in — faking a `date` stores something nobody asserted and will eventually render as a day). |
| — | No feature-flag mechanism exists anywhere in the codebase. | The blocked CV step uses a plain module constant `ONBOARDING_CV_ENABLED = false` in `src/lib/onboarding.ts`. Promotable to an env var later; a constant is enough to "build it, don't enable it". |

Nothing here is a blocker — but the spec below is written around these
realities, not the prompt's assumptions.

---

## 3. The shared shell

One shell, both flows. **Do not build a second onboarding.**

### Layout

- `src/app/onboarding/layout.tsx` — a real Next layout wrapping every
  `/onboarding/*` step.
- Company steps (`/company/onboarding[/*]`) reuse the **same two components**
  (`OnboardingShell`, `OnboardingProgress`) rather than sharing the layout
  file, because the company entry route already exists at its URL and moving
  it into a route group is a bigger change than it's worth. Both options are
  viable; recommendation is the shared-component one (zero file moves, zero
  route-resolution risk). If you'd rather it be a route group
  (`src/app/(onboarding)/…`, URLs unchanged), say so.

### Left panel (both flows, desktop only — stacks above content on mobile)

- The poster gradient (`--bg` → violet → magenta, the same one already on the
  company banner and defined in `globals.css`).
- The ESENet wordmark (`<Logo />`).
- **One line of copy.** Student: "Set up your profile so companies can find
  you." Company: "Set up your company so students can find your roles."
- Nothing else. No mascot, no plane, no illustration, no stars, no second
  paragraph. (§8.)

### Progress bar

- A solid `--accent` fill on a `--surface-alt` track. **Not** the brand
  gradient — §8 caps the gradient at the match arc and the company banner; a
  gradient progress bar is a third instance and therefore a mistake.
- Markup:
  ```
  <div role="progressbar"
       aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}
       aria-valuetext={`Step ${step} of ${total}`}>
  ```
- A **visible** text equivalent next to it: `Step 2 of 5` in mono
  (`--text-faint`). Not just the graphic.
- Width transition wrapped `motion-reduce:transition-none`. No other motion in
  the shell.

### Step chrome (every step)

- One `<h1>` — a question a person would actually ask (see each step).
- One short line of sub-copy, optional.
- The step's `<form>`, posting to that step's server action.
- A footer row: **Back** (left) + **Continue** (right, primary, 44px).
  - **Back is an `<a href>` to the previous step URL**, not a JS handler — so
    the browser back button and the on-screen button do exactly the same
    thing. On step 1 there is no Back.
  - Non-sticky, in the flow (consistent with §5 item 1's anti-sticky stance).
    Steps are kept short enough that Continue is reachable; the Skills step
    pins the selected set at the top so the button never drifts far.
- `autoFocus` on the first control of the step (first input, or the first
  card in a card group). Server-rendered, so focus lands on first paint.
- Native `<form>` submit → **Enter advances** for free.
- Inline field errors **under the field**, in `--magenta`, from the action's
  returned `fieldErrors` (§7). Never a toast.
- 375px is the design target: one column, full-width controls, cards stack.

---

## 4. Student flow

Order: **Goals → Identity → Skills → Education → CV.**
Goals first — cheapest question, earns the next four. CV last — likeliest drop.

Routes: `/onboarding/goals`, `/onboarding/identity`, `/onboarding/skills`,
`/onboarding/education`, `/onboarding/cv`.

`?next=<relative-path>` is threaded through every step (where to go on
completion — e.g. back to the opportunity that triggered the gate). Only ever a
same-site path, validated like `signIn` already does.

### Step 1 — Goals · `/onboarding/goals`

**Heading:** "What are you looking for?"

- **Multi-select cards, max 3** — one card per opportunity type:
  Internship · PFE · Job · Alternance. (Freelance is omitted — it's in the
  deferred freelance module.) Selected card: `--border-strong` → accent
  border, faint `bg-accent/5`, an inline check glyph (SVG, **not** an emoji).
  A live "N / 3 selected" counter in mono, like the reference.
- **Fields of interest** (below the cards): a small set of tappable domain
  chips relevant to ESEN — e.g. Data & BI, Software, E-business / ERP, Digital
  marketing, Finance, Design — plus a free-text "Add another" that appends a
  chip on Enter. Optional.

| Data | Column | New? | Action |
|---|---|---|---|
| chosen types | `student_details.goal_types text[]` | **NEW** (ruled in — §9) | `saveOnboardingGoals` (new, `actions/onboarding.ts`) |
| fields of interest | `student_details.looking_for` (existing free-text column) | no | same — chips are joined to a short string, e.g. "Data & BI, Software" |

**Continue requires:** at least one type selected. Fields of interest optional.

**Note:** `interests` as its own `text[]` column was considered and **cut** —
no consumer today, and `looking_for` already exists for exactly this. If a
scored matcher later needs it structured, that's its migration to make.

### Step 2 — Identity · `/onboarding/identity`

**Heading:** "Who are you?"

- **Name** — text, pre-filled from `profiles.full_name` (set at signup),
  editable. One field, not first/last (matches the schema).
- **Headline** — text, e.g. "Business Intelligence student at ESEN". Helper
  text explains it shows under your name everywhere.
- **Photo** — `ProfileMediaUpload kind="avatar"`, **skippable**. "Add later" is
  a visible option, not a hidden one.

| Data | Column | New? | Action |
|---|---|---|---|
| name | `profiles.full_name` | no | `updateStudentProfile` (extended to accept `full_name`, §10) |
| headline | `student_details.headline` | no | `updateStudentProfile` (partial update, §10) |
| photo | `profiles.avatar_url` + `profile-media` bucket | no | `uploadProfileMedia` (unchanged) |

**Continue requires:** name non-empty, headline non-empty. Photo never
required.

### Step 3 — Skills · `/onboarding/skills` (the one that matters)

**Heading:** "What are you good at?"

This step powers the match arc (§2 of `UX_ELEVATION.md`) and the "Recommended
for you" strip. It gets the most design attention in the flow.

- **Suggested skills, not a blank box.** Render ~18–24 skill chips sourced from
  what opportunities actually ask for: a new read-only helper
  `fetchSkillSuggestions(supabase)` = distinct values across
  `opportunities.skills` (published only), ranked by frequency, capped. No
  schema change — it's an aggregate read.
  - Fallback when the marketplace is near-empty (fresh dev DB, early days): a
    small static seed list of ESEN-relevant skills (SQL, Python, Power BI,
    Excel, JavaScript, React, …) lives beside the helper and fills the gap.
- Tap a chip to add/remove. Selected chips use the cyan `match` treatment the
  `Chip` primitive already has; the **selected set is pinned at the top** of
  the step so it's always visible and Continue never drifts far.
- **"Add another skill"** — text input, Enter appends a chip, for anything not
  suggested.
- Helper text: "Add at least 3 so we can match you to opportunities" — with one
  line explaining the arc. This is a **nudge, not a hard gate**.

| Data | Column | New? | Action |
|---|---|---|---|
| skills | `student_details.skills text[]` | no | `updateStudentProfile` (partial update) |

**Continue requires:** at least 1 skill. (Below 3, show the nudge but let them
through — hard-blocking at 3 is friction on the step people came for.)

### Step 4 — Education · `/onboarding/education`

**Heading:** "Where do you study?"

Captures **one** current/most-recent entry. `/profile` is where they add more
later; onboarding just needs the headline fact.

- **University** — text, pre-filled `"ESEN — École Supérieure de l'Économie
  Numérique"` (the platform's whole audience), editable.
- **Graduation year (or expected)** — a year select (current year − 6 …
  current year + 6).
- **Degree** — text ("Licence", "Mastère", …).
- **Specialties** — optional, comma-separated → `field_of_study`.

| Data | Column | New? | Action |
|---|---|---|---|
| university | `education.school` | no | `updateProfileItem` (new, §10) — upsert the onboarding row |
| graduation year | `education.graduation_year smallint` | **NEW** (ruled in — §9) | same |
| degree | `education.degree` | no | same |
| specialties | `education.field_of_study` | no | same |

**Revisit semantics:** on submit, if the student already has ≥1 `education`
row, `updateProfileItem` updates the most-recent one; otherwise it inserts.
Pre-fill the form from that row on load.

**Continue requires:** university, graduation year, degree.

**This step sets `onboarded_at`** when `ONBOARDING_CV_ENABLED` is `false` (the
current, shipped state): its action stamps `student_details.onboarded_at =
now()` and redirects to `next` (or `/opportunities` for a student with no
`next`).

### Step 5 — CV · `/onboarding/cv` — **BUILT, BLOCKED, NOT ENABLED**

**Heading:** "Add your CV?"

- Fully built: the drag/click PDF dropzone, "PDF only · max 5 MB", a **Skip**
  that's as prominent as Continue.
- **Gated behind `ONBOARDING_CV_ENABLED` (`src/lib/onboarding.ts`), which
  ships `false`.** While false:
  - `/onboarding/cv` is not in the step sequence, the progress bar total is 4,
    and Step 4 (Education) is the last step and the one that stamps
    `onboarded_at`.
  - Hitting `/onboarding/cv` directly redirects to `/onboarding` (which
    forwards to the resume point).
- The reason it's blocked: the `cvs` bucket and its policies
  (`0002_platform_phase2.sql` §8, widened by `0018`) have never been through a
  security review, and routing every new student into that upload path before
  the audit is not acceptable. Flip the constant *after* the storage audit in
  `SECURITY_PERFORMANCE_AUDIT.md`.
- When enabled: this step (Continue **or** Skip) stamps `onboarded_at`, and
  Education stops stamping it.

| Data | Column | New? | Action |
|---|---|---|---|
| CV file | `student_details.cv_url` + `cvs` bucket | no | `uploadCv` (unchanged) |

### After completion

`onboarded_at` is set → redirect to `next` if present and same-site, else
**`/opportunities`** — that's where the value is for a new student; `/students`
is the company-facing view.

---

## 5. Company flow

`/company/onboarding` **already exists** (create-or-join). It moves into the
same shell — same panel, same progress bar, same step chrome — and gains three
steps after it. **Its URL does not change.**

Order: **Create-or-join → Company details → Logo → First opportunity.**
Routes: `/company/onboarding` (unchanged), `/company/onboarding/details`,
`/company/onboarding/logo`, `/company/onboarding/opportunity`.
Progress total: 4.

### Step 1 — Create or join · `/company/onboarding` (unchanged behaviour)

- Exactly today's logic (`createCompany` / `searchCompanies` /
  `requestToJoinCompany` / pending-request state). Only the **chrome** changes:
  wrapped in `OnboardingShell`, progress bar at 1/4, the two-up create/join
  becomes a single column on mobile with an "or" divider.
- A user who **requests to join** an existing company sees the pending state
  and stops here — steps 2–4 are the company *owner's* setup and are already
  done by the time a member is approved. On approval they go straight to
  `/company/dashboard`.
- `createCompany` currently `redirect("/company/profile")` → change to
  `redirect("/company/onboarding/details")`.

### Step 2 — Company details · `/company/onboarding/details`

**Heading:** "Tell students about your company"

- **Website** — url, optional.
- **Description** — textarea, "What does your company do?" Optional but
  encouraged (helper text: it shows on your public page).

| Data | Column | New? | Action |
|---|---|---|---|
| website | `companies.website` | no | `updateCompanyProfile` (unchanged — safe to reuse; it never touches `verified`/`logo_url`/`banner_url`) |
| description | `companies.description` | no | same |

Continue → `/company/onboarding/logo`. No required fields (name was set in
step 1).

### Step 3 — Logo · `/company/onboarding/logo`

**Heading:** "Add your logo"

- `ProfileMediaUpload kind="avatar"` (company branch → `companies.logo_url`).
  **Skippable** — `CompanyLogo` already renders a branded initials tile when
  there's no logo, so skipping is a real, non-broken option.

| Data | Column | New? | Action |
|---|---|---|---|
| logo | `companies.logo_url` + `profile-media` bucket | no | `uploadProfileMedia` (unchanged) |

Continue / Skip → `/company/onboarding/opportunity`.

### Step 4 — First opportunity · `/company/onboarding/opportunity` (skippable)

**Heading:** "Post your first opportunity?"

- The existing `OpportunityForm`, embedded in the step. Submits via
  `createOpportunity` (status defaults to `pending`, awaits admin approval —
  unchanged).
- **Skip** is prominent. Skipping is common and fine.

| Data | Column | New? | Action |
|---|---|---|---|
| opportunity | `opportunities.*` | no | `createOpportunity` (unchanged) |

Continue (posted) or Skip → `/company/dashboard`.

### What changes for `/company/onboarding`

- **URL:** unchanged. Still the target of `requireCompanyUser`'s
  "no company yet" redirect and `signIn`'s unattached-company redirect.
- **Files:** the page moves under the shared shell (component-wrap approach:
  no move; route-group approach: `src/app/(onboarding)/company/onboarding/…`,
  URL still `/company/onboarding`). Recommendation: component-wrap.
- **`createCompany` redirect:** `/company/profile` → `/company/onboarding/details`.
- **Already-attached redirect:** `/company/onboarding` currently redirects an
  attached user to `/company/profile`; change to `/company/dashboard` (the
  more useful landing, and consistent with where the flow ends).
- **No new company columns.** "Company onboarded" = "has a `companies` row",
  which is already the gate. Steps 2–4 are polish; there's no meaningful
  "half-onboarded company" state to track, so no `companies.onboarded_at`.
- Hitting `/company/onboarding/details|logo|opportunity` directly after setup
  just shows the pre-filled form; Continue goes to the dashboard. Harmless, no
  resume bookkeeping needed on the company side.

---

## 6. Gating

**Principle: never gate a public route. The gate lives on the action and its
form UI, not on browse.**

| Surface | Gated? | How |
|---|---|---|
| `/opportunities`, `/opportunities/[id]` | **No** | Public. A student from a shared link reads the full posting. |
| `/companies`, `/companies/[id]` | **No** | Public. |
| `/students` (list) | Sign-in only (**existing**), plus now: only shows `onboarded_at IS NOT NULL` students | `fetchStudents` filter change |
| `/students/[id]` | Sign-in only (**existing**); `notFound()` if that student's `onboarded_at` is null | `fetchStudentProfile` change |
| feed | **No** | Not in scope for the gate. |
| **Apply** (`applyToOpportunity`) | **Yes** | After the role check: if `student_details.onboarded_at` is null → `redirect('/onboarding?next=/opportunities/<id>')`. The apply form on the detail page shows "Finish your profile to apply" (link to the same URL) instead of the form for a signed-in, non-onboarded student. Anonymous users still get today's `redirect('/login?next=…')` first. |
| **Post** (`/company/opportunities/new`, `createOpportunity`) | **Yes, already** | `requireCompanyUser` redirects a user with no company to `/company/onboarding`. That *is* the publish gate. No change needed beyond what exists. (Companies are gated from publishing, not browsing — already true.) |

### The apply round-trip

1. Anonymous → Apply → `/login?next=/opportunities/<id>` (existing).
2. After login, non-onboarded student → the detail page shows "Finish your
   profile to apply" → `/onboarding?next=/opportunities/<id>`.
3. Onboarding completes → redirect to `next` → back on the opportunity, apply
   form now live.
4. A direct POST to `applyToOpportunity` by a non-onboarded student →
   `redirect('/onboarding?next=…')` server-side. RLS is not involved (same
   pattern as the existing deadline gate).

---

## 7. Resumability

**Save on each step. State in the URL. Server-rendered. Browser Back works.**

### Model

- Each step is its **own route** (`/onboarding/skills`), a server component.
  There is no client wizard object and no `useState` step counter.
- Each step's `<form>` posts to that step's server action, which **writes that
  step's columns and only those**, then `redirect()`s to the next step
  (threading `?next=`).
- Someone who closes the tab at step 3 has steps 1–2 already persisted in
  `student_details` / `profiles`.

### Resume logic

`/onboarding` (the index route) computes the first incomplete step and
`redirect()`s there:

```
if (onboarded_at)              → redirect(next ?? '/opportunities')
else if (!goal_types.length)   → /onboarding/goals
else if (!full_name || !headline) → /onboarding/identity
else if (!skills.length)       → /onboarding/skills
else if (no education row)     → /onboarding/education
else if (CV enabled && never saw CV step)  → /onboarding/cv
else                           → (stamp onboarded_at, redirect out)
```

Each individual step route runs the **same guard** on load: if an *earlier*
required step is incomplete, redirect back to it. So deep-linking
`/onboarding/skills` before doing Goals bounces to `/onboarding/goals`. Going
*back* to a completed step is always allowed (edit and re-submit).

There is no separate "current step" column — completion is inferred from the
data each step writes. The one explicit marker is `onboarded_at` (the finish
line), because "has some skills and an education row" is not the same as "chose
to finish".

### Company side

No resume tracking. A company with a row is valid; steps 2–4 are optional and
re-enterable. `/company/onboarding` redirects an attached user to the
dashboard; the step URLs just show pre-filled forms.

---

## 8. New columns + RLS

All on `student_details`, which already has exactly two policies (from
`schema.sql`):

- `"student details are publicly readable"` — `SELECT using (true)`
- `"students manage their own details"` — `ALL using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id)`

RLS is row-level; **new columns inherit both policies automatically** — owner
writes their own row, everyone can read it. No new policy is written for any of
these. All three below are **ruled in** (§9); `interests` was **cut**.

| Column | Type | Written by | Read by | Notes |
|---|---|---|---|---|
| `student_details.goal_types` | `text[] not null default '{}'` | the student (Goals step) | public (like `skills`) | App validates against `{internship,pfe,job,alternance}`. Plain `text[]` to match how `skills` is done, not an enum array. |
| `student_details.onboarded_at` | `timestamptz` (nullable) | the student (final step's action) | public | The finish-line marker. Gates apply + `/students`. Ships with the "can't un-set" trigger below. |
| `education.graduation_year` | `smallint` (nullable) | the student (Education step) | public | Inherits `education`'s owner-write / public-read policies. No new policy. |

### `onboarded_at` — tamper note + optional hardening

Because `student_details` is owner-writable at the row level, a student *could*
set `onboarded_at` early via a crafted request. Impact: they'd appear in
`/students` and could apply with a thin profile — which is **exactly today's
behaviour** (no gate at all), so this is not a regression.

**Ruled in:** a `BEFORE UPDATE` trigger on `student_details`, consistent with
how the project already does column-level rules
(`0013_deactivated_identity_frozen`, `protect_post_admin_fields`), that
**refuses to change `onboarded_at` from a non-null value back to `null`** —
you can't "un-onboard" yourself. (The stricter "refuse to set unless
skills/headline/education present" guard is not required — the app enforces
the step order, and the worst case is a thin profile in the directory, same
as today.)

### Migration notes (write the file when the feature is built, not now)

- New file `supabase/migrations/0024_student_onboarding.sql`, additive.
- `add column if not exists`:
  - `student_details.goal_types text[] not null default '{}'`
  - `student_details.onboarded_at timestamptz`
  - `education.graduation_year smallint`
- The `BEFORE UPDATE` trigger + function on `student_details` guarding
  `onboarded_at` against null-ing (see above).
- **Backfill** so existing profiles don't drop out of `/students` — this is
  the ruled decision, not an option:
  ```sql
  update student_details
  set onboarded_at = now()
  where onboarded_at is null
    and (headline is not null or bio is not null or skills <> '{}');
  ```
  Same predicate `fetchStudents` uses today — everyone currently listed stays
  listed.
- `goal_types` / `graduation_year` backfill: none (defaults cover it, neither
  gates anything).

---

## 9. Decisions — ruled by Bilel

| # | Decision | Ruling |
|---|---|---|
| 1 | `student_details.goal_types text[]` | **Yes** — needed. |
| 2 | `student_details.interests` | **Cut** — fold fields-of-interest into the existing `looking_for` free-text. |
| 3 | `student_details.onboarded_at timestamptz` | **Yes**, with the "can't un-set" `BEFORE UPDATE` trigger. |
| 4 | Graduation year | **Add `education.graduation_year smallint`.** Faking `end_date = <year>-06-30` stores a date nobody asserted and something will eventually render it as a day. |
| 5 | `/students` membership | Switch to `onboarded_at IS NOT NULL`; **backfill** existing rows with today's `headline/bio/skills` heuristic so nobody currently listed disappears. |
| 6 | Company that skipped details/logo | **Can still post** — today's behaviour holds. A company blocked from posting is a company that leaves. Steps 2–4 stay encouragement, not a gate. §14 is closed on this. |

Still my call (not blocking — presentation-ish), noted for when the feature is built:

- **Post-completion redirect** — `/opportunities` (where the value is) vs
  `/students`. Going with `/opportunities`.
- **Shell wiring** — shared `OnboardingShell` component (no file moves) vs a
  `(onboarding)` route group. Going with the component.

**The migration file is written when the feature is built, not now.**

---

## 10. Server actions — reuse / refactor / new

| Action | File | Change |
|---|---|---|
| `updateStudentProfile` | `actions/student-profile.ts` | **Refactor to partial update** — write only columns whose keys are present in the FormData. Also accept an optional `full_name` and, when present, update `profiles.full_name` in the same call. `/profile`'s form is unaffected (it always submits every field). |
| `uploadCv` | `actions/student-profile.ts` | Unchanged. Reused by the (blocked) CV step. |
| `uploadProfileMedia` | `actions/profile-media.ts` | Unchanged. Reused by Identity (photo) and company Logo steps. |
| `addProfileItem` / `deleteProfileItem` | `actions/profile-items.ts` | Unchanged. |
| `updateProfileItem` | `actions/profile-items.ts` | **New** — generic update mirroring `addProfileItem` (table allow-list, column allow-list, `.eq('id', …).eq('profile_id', user.id)`). Used by the Education step's upsert; also lets `/profile` finally edit entries instead of delete-and-re-add. |
| `updateCompanyProfile` | `actions/company-profile.ts` | Unchanged. Reused by the company Details step. |
| `createCompany` | `actions/company-onboarding.ts` | Redirect target: `/company/profile` → `/company/onboarding/details`. |
| `createOpportunity` | `actions/opportunities.ts` | Unchanged. Reused by the company first-opportunity step. |
| `applyToOpportunity` | `actions/applications.ts` | **Add the onboarding gate** — after the role check, `redirect('/onboarding?next=…')` if `onboarded_at` is null. |
| `saveOnboardingGoals` (+ per-step stampers) | `actions/onboarding.ts` (**new file**) | The Goals step has no existing action. Thin: validate, write `goal_types` (+ `looking_for`), `redirect` to the next step. The final step's action additionally stamps `onboarded_at`. Everything a `/profile` action already covers is delegated to that action, not re-implemented here — so there's still one write path per column. |

### Data-layer reads (not actions)

| Function | File | Change |
|---|---|---|
| `fetchStudents` | `lib/students.ts` | Filter `onboarded_at IS NOT NULL` instead of the `headline/bio/skills` heuristic. |
| `fetchStudentProfile` | `lib/students.ts` | Select `onboarded_at`; return `null` (→ `notFound()`) when it's null. |
| `fetchSkillSuggestions` | `lib/onboarding.ts` (**new**) | Distinct `opportunities.skills` (published), frequency-ranked, capped; static fallback list. Read-only. |
| `requireStudentUser` | `lib/auth/require-student.ts` | Optionally return `onboarded_at` so pages/forms can branch without a second query. |

---

## 11. Cut from the reference (and why)

`hi-talents.com/en/onboarding` collects **gender, date of birth, phone, country
of residence**. All four are cut.

- **Country of residence** — ESENet matches ESEN students to internships/PFE/
  jobs at Tunisian companies and partners. Location lives on the *opportunity*
  (`opportunities.location` + `remote`), not the student. "Go abroad" as an
  intent belongs to the deferred international module; revisit then.
- **Date of birth / gender** — zero matching value, and both are
  privacy-sensitive (gender is special-category data under GDPR readings) —
  pure liability with no flow that consumes them.
- **Phone** — contact happens through the platform and email. A phone column is
  a breach magnet with no feature behind it.

If any of these earns its place later, it comes with a flow that actually uses
it — not "collect it because the reference did".

Also **not** in the student flow, deliberately, to keep it to five short
screens: `availability` (defaults to "available now", editable on `/profile`),
`bio`, `linkedin_url`, and additional education/experience/project entries. All
live on `/profile`, which onboarding funnels into.

Also cut: the reference's **"Share my profile with partner companies" toggle** —
there is no profile-visibility system in ESENet (see §2), and student profiles
are simply public-read to signed-in members once onboarded.

---

## 12. Route structure (summary)

```
/onboarding                    index — resume redirect (see §7)
/onboarding/goals              step 1
/onboarding/identity           step 2
/onboarding/skills             step 3
/onboarding/education          step 4  (stamps onboarded_at while CV disabled)
/onboarding/cv                 step 5  (built; behind ONBOARDING_CV_ENABLED=false)
                                        (redirects to /onboarding while disabled)

/company/onboarding            step 1 — create-or-join   (URL UNCHANGED)
/company/onboarding/details    step 2
/company/onboarding/logo       step 3
/company/onboarding/opportunity step 4  (skippable → /company/dashboard)
```

New layout: `src/app/onboarding/layout.tsx`.
New components: `OnboardingShell`, `OnboardingProgress`, plus per-step client
bits for the card/chip multi-selects (no new dependency — plain
`useState` in a small client component per step, or uncontrolled inputs +
hidden field, same as the existing skills input on `/profile`).
New lib: `src/lib/onboarding.ts` (`ONBOARDING_CV_ENABLED`,
`fetchSkillSuggestions`, step-order helpers).
New action file: `src/app/actions/onboarding.ts`.

**No new dependency. No form library. No state-machine package.** (§ prompt.)

---

## 13. Quality bar (restated, binding)

- 375px is the primary target — one question per screen should feel *better* on
  a phone than on desktop.
- Inline field errors under the field, `--magenta`, never a toast.
- 44px touch targets; `compact` (36px) only inside dense rows if any appear.
- Enter advances; `autoFocus` on the first control of every step.
- Progress bar: `role="progressbar"` + `aria-valuetext` + a visible "Step N of
  M". Not just a graphic.
- `prefers-reduced-motion`: the progress-fill transition is the only motion,
  and it's disabled under reduced-motion.
- Every step route gets a `loading.tsx` shaped like the shell (panel + progress
  + a form skeleton).
- Copy: English, sentence case, plain verbs, no exclamation marks, no emoji, no
  filler. Every heading is a real question.
- `:focus-visible` ring in `--accent-2` on every control (§6).

---

## 14. Closed

Should a company that created a row and then **skipped** details/logo/first-
opportunity still be able to post? **Ruled: yes** — a row is a row. "A company
blocked from posting is a company that leaves." Steps 2–4 stay encouragement,
never a gate. `createOpportunity` keeps its current guard (`requireCompanyUser`
+ admin verification), nothing stricter.
