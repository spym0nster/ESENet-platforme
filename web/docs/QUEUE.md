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
| 2 | Signed-in navigation (avatar menu, role-aware) | ✅ done — traced (no signed-in seed) |
| 3 | Phase 3 item 6 — `/` landing rebuild | ✅ done — verified (public page) |
| 4 | Phase 3 item 7 — the route sweep | ✅ done (6 commits) — traced |
| N3–N7 | Follow-ups from the first review | ✅ done (N3 verified, N4 verified) |
| A | Keyboard pass on the signed-in nav | ✅ done — report below |
| B | Consistency sweep | ✅ **swept** — B1–B7 done, 8 commits |
| O | Onboarding | ⏸ **migration + shell built; steps paused for your migration review** |

### Onboarding — where it stands

- `0024_student_onboarding.sql` — **written, committed, NOT applied.** goal_types
  + onboarded_at (student_details), graduation_year (education), a BEFORE
  UPDATE trigger freezing onboarded_at, the /students backfill. Additive,
  re-runnable, no new RLS policy. **This is your review gate — the 9 step
  pages hard-depend on its exact column names / types / trigger behaviour, so
  I stopped here rather than build them against an unreviewed data change.**
- Shell built (`cea3f2b`): `OnboardingShell` (poster-gradient panel + wordmark
  + one line — a deliberate §8 exception for the funnel), `OnboardingProgress`
  (solid --accent, `role="progressbar"` + `aria-valuetext` + visible "Step N
  of M"), `src/lib/onboarding.ts` (CV flag off, step-order helpers),
  `/onboarding/layout.tsx`. No step pages yet — `/onboarding` isn't a live
  route.
- `src/types/database.ts` NOT touched — the new-column types land with the
  first step that reads them.

**Next, once you've ok'd the migration:** student steps in flow order
(Goals → Identity → Skills → Education → CV-behind-flag), then company steps,
then the gating wiring (fetchStudents filter, applyToOpportunity gate,
post-signup redirect) — that last part only lands after the migration is
actually applied, since it would break /students against a DB without the
column.

---

**The elevation is code-complete.** One gap surfaced during the B sweep —
see N8. Onboarding is starting now (migration first, shown before it's
applied).

---

## B sweep — done (`f???`… 8 commits)

| # | Ruling | Commit |
|---|---|---|
| B1 | mono eyebrow for a label; Poppins `text-lg font-semibold` for a real section heading | outliers converted |
| B2 | `text-3xl font-extrabold` for every page title; **`UX_ELEVATION.md` §3 amended** to 30 / 800 with the reasoning | done |
| B3 | "← Back to X" everywhere, `inline-block py-2` target | done |
| B4 | "No X yet", no trailing period | done |
| B5 | EmptyState CTAs all `LinkButton variant="primary"` | done |
| B6 | notification bell onto `useDisclosure` — every header menu now keyboard-operable | done |
| B7 | `Section` extracted to `ui/Section` | done |
| — | + a correction: 2 `Badge variant="info"` the item-7 grep missed (`students/page`, `team-member-row`) | done |

---

## B — Consistency sweep (drift found; nothing changed)

Same idea implemented more than one way, across all the routes touched over
these sessions. Ranked by how visible the inconsistency is.

### B1 — Section headings, ~4 ways *(most visible)*

| Style | Where | Count |
|---|---|---|
| `font-mono text-xs uppercase tracking-widest text-text-muted` | most section labels | 17 |
| …`text-text-faint` (pre-sweep, missed) | 2 spots | 2 |
| `font-mono text-xs font-semibold uppercase …text-muted` | `/applications/[id]` | 2 |
| `font-display text-lg font-semibold` | `/students/[id]`, `/company/dashboard` "Postings" | 2 |
| `font-display text-xl font-semibold` | landing "Latest opportunities" | 1 |
| `font-display text-lg/base font-bold` (leftover) | 2 spots | 2 |

**Recommend:** one rule. Either "section labels are always the mono eyebrow"
(`text-xs uppercase tracking-widest text-text-muted`) and the Poppins `text-lg`
is only for true content headings, or the reverse. I lean mono-eyebrow for
labels, Poppins `text-lg` only where a section is a real heading a user would
read (the `/students/[id]` timeline sections, "Latest opportunities"). Pick one
and I'll sweep it.

### B2 — Page-title `h1`, 4 ways

| Style | Where |
|---|---|
| `font-display text-3xl font-extrabold` | 24 pages — the de-facto standard |
| `font-display text-[29px] font-semibold tracking-tight` | `/opportunities`, `/feed` — someone applied §3's "29 / 600" literally to just these two |
| `font-display text-2xl font-extrabold` | `/applications/[id]` (a sub-detail page) |
| `font-display text-2xl font-bold` | the "connect Supabase" fallback h1s on `/companies` + `/students` |

Plus the **eyebrow above h1** tracks with it: the two `text-[29px]` pages use a
`text-[11px]` eyebrow; the other 23 use `text-xs`.

**Recommend:** standardise on `text-3xl font-extrabold` + `text-xs` eyebrow (the
24-page majority; `font-extrabold` also gives the page title the "loudest thing"
weight §1 wants). That means `UX_ELEVATION.md` §3's type-scale row for "Page
title" is wrong for this codebase and should read 30 / 800, or the two
`text-[29px]` pages change. Your call which direction; I'll align all of them.

### B3 — "Back" links, mixed prefix + one smaller target

`← All companies` / `← All students` / `← All opportunities` /
`← All applications` (list-returns) vs `← Back to dashboard` (edit page) vs
`← Admin overview` (admin subpages) vs `← Previous` (pagination).
Also `/applications/[id]`'s back link is missing the `inline-block py-2` the
others have, so its tap target is shorter.

**Recommend:** `← All <things>` for every "up to the list" link; keep
"Back to …" only for a genuine one-step-back. Standard class
`inline-block py-2 font-mono text-xs text-accent-2 hover:text-text` everywhere.

### B4 — EmptyState titles, 4+ patterns

`No applicants yet.` (trailing period) · `No applications yet` · `No posts yet`
· `No description yet` · `No team members listed` · `Nothing here yet` ·
`Nothing open` · `Nothing pending` · `Nothing saved yet` · `Nothing yet`.

**Recommend:** `No <plural noun> yet`, never a trailing period, for the
"you have none" case; `Nothing <state>` only where "no X yet" reads wrong
(`Nothing to review`). I'll normalise.

### B5 — EmptyState CTA style

Most are now `<LinkButton variant="primary">`. A few are still a mono `<Link>`
(`/companies/[id]` roles-tab "Browse all opportunities", the older
"Browse opportunities →"). §4 says EmptyState has "one primary CTA" —
recommend all become `LinkButton variant="primary"`.

### B6 — `NotificationBell` doesn't use the shared disclosure hook

`AvatarMenu` and `MobileNavMenu` now share `useDisclosure` (Escape + focus
return, arrow cycling, focus trap, focus-first-on-open). The bell still has its
own older handler: Escape + outside-click only — **no focus move on open, no
trap, no arrow keys**. It's the one header menu that isn't keyboard-complete.
Recommend porting it to `useDisclosure`.

### B7 — a local `Section` component

`/students/[id]` defines its own `function Section({title,children})`. It's the
only user, so this is minor — but if B1 lands on "Poppins `text-lg` for real
section headings", that helper should become `ui/Section` and be reused.

### Resolved along the way (no drift — noting so you know it was checked)

- Success/info banners: now uniformly
  `rounded-ctrl border border-accent/30 bg-accent-soft … text-accent-on-soft`
  across `signup-form`, `student-profile-form`, `company-profile-form`,
  `/company/dashboard`.
- Upload confirmations: both say `Uploaded.` now.
- `Badge` deprecated `variant=` names: gone from `src/` entirely.
- Emoji in product chrome: gone from `src/` entirely.

---

## A — Keyboard pass on the signed-in nav

**Traced, not executed** where noted — `AvatarMenu` only mounts for a
signed-in user and there's no seed account. The shared `useDisclosure` hook it
uses *was* exercised live through the anonymous `MobileNavMenu` (same hook):
open → focus first item, Escape → close + focus returns to trigger, both
confirmed in the browser.

### Tab order through the bar (desktop, signed in)

Traced from the DOM (`SiteHeader` → `HeaderNav`):

1. `Skip to content` skip-link
2. Logo (`<Link href="/">`)
3. Section links, left to right: Opportunities → Companies → Students → Feed →
   Dashboard (company) / Admin (admin)
4. Notification bell button
5. Account-menu trigger
6. → into `<main>`

Matches visual order, no traps outside a menu, nothing reachable that isn't
visible.

### Into the account menu

- Trigger has `aria-haspopup="menu"`, `aria-expanded`, `aria-label="Account
  menu"`. Enter/Space/click opens (native button).
- On open, `useDisclosure` focuses the first focusable in the panel — the first
  account item on desktop, the first section link in the mobile sheet.
- **Arrows** cycle every `a[href]`/`button` in the panel, wrapping. *(hook
  verified via MobileNavMenu)*
- **Escape** closes and moves focus back to the trigger. *(verified)*
- **Tab / Shift+Tab** wrap at the ends — focus is trapped in the panel while
  open. *(verified via MobileNavMenu)*
- Clicking an item closes the menu, then navigates; focus lands on the new page.
- Outside click (mousedown) closes without stealing focus.
- Mobile sheet: a `bg-black/40` backdrop; tapping it closes.

### Can't confirm without a session

- `AvatarMenu` itself rendering — trigger markup (avatar + chevron) differs from
  the hamburger, though the `useDisclosure` wiring is identical.
- Any screen-reader behaviour: `role="menu"` / `role="menuitem"` announcement,
  `aria-expanded` transitions, whether the section-links `<ul>` inside the sheet
  should be its own labelled group.
- The bell dropdown's keyboard is **known-incomplete** — see B6.

---

## Needs Bilel

### N8 — the two directory list pages were never swept

`src/app/students/page.tsx` and `src/app/companies/page.tsx` (the `/students`
and `/companies` directory lists) were **not in item 7's route list**, so they
still carry pre-elevation markup: bespoke `rounded-md bg-accent` login buttons,
a **mono** `rounded-md bg-accent font-mono` search button, inline
`rounded-lg border` cards instead of `Card`, `text-text-faint` on the avatar
initials. B fixed only what its own findings touched there (h1, empty-state
wording + CTA, the two stray badges).

They need one sweep commit — same mechanical work as item 7. Doing onboarding
first as instructed; say if you want this sweep before it.

### N1 — `HeaderNav` props signature changed (item 2)

`HeaderNav` gained four required props (`displayName`, `email`, `avatarUrl`,
`companyName`) so the account menu can render name/email/company. It has one
caller (`SiteHeader`), edited in the same commit, so nothing external breaks —
but "changing a props signature" is on your do-not-do list, so flagging it.
Revert path is clean if you'd rather the menu fetch its own data client-side
(worse — another round trip per page) or read from a context.

### N2 — admin bar interpretation (item 2)

You wrote "Admin: the company set plus Admin." I read "the company set" as the
four public links (not the company's *Dashboard*, which dead-links for an
admin — `requireCompanyUser` bounces them). So the admin **bar** is
`Opportunities · Companies · Students · Feed · Admin`, and the admin **menu**
is Admin · Reports · Notifications · Log out. Say if you wanted a literal
"Dashboard" entry for admins.

### N5 — `/saved` data-select widened (item 7)

Converting `/saved` to `OpportunityCard` + arcs needed the row query to
select `skills`, `application_deadline`, `logo_url` (additive, same query) and
one extra `student_details.skills` read for the arc numerator. You explicitly
asked for arcs on `/saved`, so I took that as authorising the data it needs —
flagging per the "stop when a design need requires a data change" rule.
Nothing structural, no new round trip beyond the one skills read.

### N6 — `opportunity-form` inputs not fully migrated (item 7)

The form's action buttons became `Button`/`LinkButton` and its `rounded-md`
inputs became `rounded-ctrl`, but the `<select>` / `<textarea>` / checkbox
markup is still hand-rolled rather than the `Select`/`Textarea` primitives.
DESIGN_SYSTEM.md deferred that form's migration to "next time it's modified,
rather than a separate sweep that risks a regression" — and I can't test the
posting flow without seed data. Finish it when the seed lands and the flow
can be exercised.

### N7 — a few list routes still have no `loading.tsx` (item 7)

`/companies` and `/students` (the two directory list pages) weren't in item
7's route list and still lack `loading.tsx`. Auth pages (`/login`, `/signup`,
`/forgot-password`, `/reset-password`) deliberately have none — they're static
shells around client forms with nothing async to skeleton.

### N1–N7 status after your first review

| # | Ruling | Done |
|---|---|---|
| N1 | approved | kept |
| N2 | your reading correct — 4 links + Admin, no Dashboard | kept |
| N3 | fix it — one sheet below 640px | ✅ `26ef820`… see the N3-fix commit; verified in browser |
| N4 | one source, three consumers | ✅ `src/lib/poster-gradient.ts`; hex now in one file; verified |
| N5 | approved | kept |
| N6 | park until seed | parked — `opportunity-form` inputs still hand-rolled |
| N7 | add `/companies` + `/students` `loading.tsx`; auth stays without | ✅ done |

---

## Log

### Item 1 — Onboarding spec
`ONBOARDING.md` updated with the six column/gating rulings (§9): `goal_types`
yes, `interests` cut (folded into `looking_for`), `onboarded_at` yes + can't-
un-set trigger, `education.graduation_year smallint` added, `/students`
switches to `onboarded_at IS NOT NULL` with a heuristic backfill, company that
skipped steps 2–4 can still post (§14 closed). Migration file is written when
the feature is built, not now. Spec only — no code.

### Item 7 — The route sweep (6 commits)
`7a` /saved · `7b` /applications + /applications/[id] + /notifications ·
`7c` /profile + its form components · `7d` company pages (profile, team,
opportunity new/edit, applicants) · `7e` /admin/companies + /admin/reports ·
`7f` auth pages. One commit per area to stay under the ~6-file limit.

Across all of them:
- **Deprecated `Badge variant=` (info/success/danger) → `tone=`** everywhere —
  `grep` for the old names now returns nothing in `src/`.
- **All emoji gone from `src/`** — the notification `KIND_ICON` maps (bell +
  `/notifications`), the bell's 🔔, "Uploaded ✓". `grep` for emoji ranges in
  `src/` is now empty.
- Section eyebrows `text-faint` → `text-muted` (the §3 AA note), `font-bold` →
  `font-semibold` on titles, `rounded-md`/`rounded-lg` → `rounded-ctrl`/
  `rounded-card`, inline `style={{ background: var(--accent-soft) }}` success
  banners → token classes (4 forms).
- `size="compact"` on the upload / add-item / opportunity-form buttons that
  had ad-hoc `px-4 py-2 text-xs`.
- EmptyState CTAs made primary buttons; EmptyState titles lost trailing periods.
- Auth h1 normalised `text-2xl font-bold` → `text-3xl font-extrabold`.
- `/saved` folded into `OpportunityCard` with the match arc (cross-company).
- **19 `loading.tsx` files now** — added for /saved, /applications(+[id]),
  /notifications, /profile, all 5 company routes, both admin queues.
- **Traced, not executed** for every signed-in page. `/signup` verified in the
  browser; lint + build clean at all six commits.

### Item 3 — Landing page (`/`)
- Heading gradient **cut** — "From Talent Fair to Talent Network" is now solid
  white (§8, and the item asked for it).
- All raw hex gone from `page.tsx`. The hero band's four-stop gradient moved
  into a new CSS token `--poster-grad` in `globals.css` (same pattern as the
  existing `--logo-grad`; §8 permits a gradient on the marketing page). Hero
  text colours are now `text-white/60|70|80` instead of `#A79FD6` / `#D8D4F0`
  / `#B3ADD9`.
- Hero CTAs: `rounded-md` → `rounded-ctrl`, 44px min height, `:active` press,
  `motion-reduce` guard. Feature cards now compose the `Card` primitive
  (`rounded-lg` → `rounded-card`), `font-bold` → `font-semibold`.
- `py-28` (off-scale) → `py-24 sm:py-32`; `mt-5` → `mt-6`.
- Real opportunities already sat above the feature cards (added in an earlier
  commit) — order kept, section tidied.
- Verified in the browser at desktop + mobile: solid heading, gradient band,
  n=1 opportunity tile renders, no console errors. lint + build clean.
- **Still carrying poster-gradient hex inline** (out of scope for item 6, not
  touched): `companies/[id]` `BANNER_GRADIENT` (a 135° variant), and the two
  `opengraph-image.tsx` routes (the `next/og` runtime can't read CSS custom
  properties). See Needs Bilel N4.

### Item 2 — Signed-in navigation
- New `AvatarMenu` client component (`src/components/avatar-menu.tsx`): click to
  open, Escape closes + returns focus to trigger, Arrow keys cycle menuitems,
  outside-click closes. Dropdown ≥640px, bottom sheet + backdrop <640px.
  Role-aware items: student → My profile / Saved / My applications /
  Notifications; company → Company profile / Team / Notifications; admin →
  Admin / Reports / Notifications. Name + email (or company name) header.
  **Log out lives only here** now.
- `HeaderNav`: removed the bar's "Sign out" form. Signed-in bar =
  Opportunities · Companies · Students · Feed, plus Dashboard (company) or
  Admin (admin), plus the bell, plus the avatar menu. Anonymous bar unchanged
  (Log in secondary / Sign up primary).
- `NotificationBell`: de-emojied — the 🔔 is now an inline SVG, the count is a
  small badge, and the per-row emoji icons (`KIND_ICON`) are dropped from the
  dropdown (title + body already carry the meaning). `/notifications` page
  still has its own `KIND_ICON` — that's item 7's to clean up, kept out of
  this commit.
- `SiteHeader`: now also selects `full_name`, `avatar_url`, `user.email`, and
  (company role only) the company name via `resolveCompanyId`.
- **Traced, not executed** — no signed-in seed account, so the student/company/
  admin menu variants, keyboard nav, and the mobile sheet are reasoned through,
  not clicked. Anonymous header verified in the browser (renders unchanged, no
  console errors), lint + build clean.

### Audit — F3, F4
Added to `SECURITY_PERFORMANCE_AUDIT.md`, report-only:
- **F3** — `student_details` (+ child tables) are `SELECT using (true)`; no
  visibility column; a student can't opt out and any authed user can read every
  profile straight from PostgREST. Needs a product decision before real
  students arrive.
- **F4** — `updateStudentProfile` writes all six columns every call, so any
  partial write nulls the rest. Latent today (the one caller sends all fields),
  live bug the moment anything else calls it.
