# QA fixtures & regression flow

This project has three permanent QA accounts seeded in the real (dev)
Supabase project. They exist to manually re-verify the core marketplace loop
whenever a change touches auth, companies, opportunities, applications, or
RLS — see the checklist at the bottom.

**These are development/QA fixtures, not real users.** Never treat them as
production identities, never surface them in product UI, and never point a
real company or student at these credentials.

## Accounts

| Role | Email |
|---|---|
| Company A | `esenet.qa.company.a@gmail.com` |
| Company B | `esenet.qa.company.b@gmail.com` |
| Student | `esenet.qa.student.a@gmail.com` |
| Admin | `esenet.qa.admin@gmail.com` (added in the Phase 2 platform build, for testing company verification) |

Password is the same for all four. **Intentionally not written down in this
file** — it was set when these accounts were created; ask whoever has it
(it's in the setup conversation history) rather than committing it here. If
it's ever lost, the fix is a normal Supabase password reset for each of the
three accounts — that does not affect any of their existing data below.

## What already exists (do not delete or recreate)

- Company A profile + `companies` row
- Company B profile + `companies` row
- Student profile + `student_details` row
- One opportunity owned by Company A: **"Business Intelligence PFE Intern"**
  (type `pfe`, status `published`)
- One application: the QA student → that opportunity

These are the baseline fixtures for the regression flow below. If a feature
change genuinely requires new QA data (e.g. a second opportunity to test
pagination), add to this file — don't repurpose or mutate the existing rows.

## Regression flow (manual)

Run this after any change touching auth / companies / opportunities /
applications / RLS. All three accounts share the password above.

**Company A**
1. Log in at `/login`
2. Should land able to reach `/company/dashboard` via the "My company" nav link
3. Confirm the existing "Business Intelligence PFE Intern" opportunity is listed, status `published`
4. Optional: post a new test opportunity, confirm it appears immediately in "My opportunities" and does not disturb the existing one

**Student**
1. Log in
2. Go to `/opportunities` — confirm the Company A opportunity is listed; try the keyword/company/location/type/skill filters and both sort orders
3. Open its detail page — confirm title/description/skills/location/dates/company are correct
4. The existing application should already show as "You've applied to this opportunity." (don't re-apply as a new row — RLS/unique constraint prevents duplicates anyway)
5. Go to `/applications` ("My applications" in the nav) — confirm the same application shows with its current status; do **not** click Withdraw on the real fixture (it's a one-way status change) — if you need to test withdrawal, use a scratch application, not the QA fixture one

**Company B**
1. Log in
2. `/company/dashboard` should show Company B's own (likely empty) list — **must never show Company A's opportunity**

**Admin**
1. Log in as `esenet.qa.admin@gmail.com`
2. `/admin/companies` ("Admin" in the nav) — should list every company with a verified/pending state
3. Do not un-verify Company A or Company B here — both are meant to stay verified as part of the baseline

**Applicant pipeline (Company A)**
1. From `/company/dashboard`, click "View applicants" on the fixture opportunity
2. Confirm the QA student's application is listed
3. Changing its status here is safe to test, but reset it back to `applied` afterward (via the same dropdown, or ask an admin/dev to reset it in the database) so the baseline stays predictable for the next person

**Student profile (`/profile`)**
1. Log in as the QA student
2. Core fields (headline/bio/skills/looking for/availability/LinkedIn) save via one form
3. Education / Experience / Projects / Certifications each have their own "+ Add" mini-form and a "Remove" button on each entry — all four share one generic component (`profile-item-section.tsx`) and one generic server action (`profile-items.ts`), so testing one thoroughly (Education) is a reasonable proxy for the other three
4. CV upload accepts PDF only, up to 5MB, stored in the private `cvs` Storage bucket at `<student_id>/cv.pdf`; a signed URL is generated per page load to view it (bucket is private, not public)
5. Leave the QA student's profile empty (no education/experience/etc rows) after testing — add-then-remove your test entries rather than leaving them, so the fixture stays clean for the next person

**Company profile (`/company/profile`)**
1. Log in as a company; edit name/website/description; upload a logo/banner separately (see Profile media below)
2. The verified badge here is read-only — this page can never touch `verified` (enforced both by the action never sending that field and by the `protect_company_verified` trigger)

**Profile media — photo/banner (student) and logo/banner (company)**
Uploaded to one shared **public** Storage bucket (`profile-media`), unlike
the private `cvs` bucket — these images are meant to be seen by anyone who
can already see the profile/company page, so a plain public URL is used
(no signed-URL step). Path is `<owner_id>/avatar.<ext>` or
`<owner_id>/banner.<ext>`; `<owner_id>` is the student's own id, or the
company's `profile_id` (which a team member writes to even though it isn't
their own auth id — covered by the same `is_company_actor` check used
everywhere else). One shared action (`uploadProfileMedia` in
`actions/profile-media.ts`) and one shared component
(`ProfileMediaUpload`) handle both roles — only the target table/column
differs (`profiles.avatar_url`/`banner_url` vs `companies.logo_url`/`banner_url`).
1. As a student on `/profile`, upload a Photo and a Banner (JPG/PNG/WEBP, ≤5MB) — confirm the image renders and is fetchable at its public URL with no auth
2. As a company on `/company/profile`, upload a Logo — confirm it also shows on the public opportunity detail page next to the title
3. Clear them again afterward (`PATCH` the row's `*_url` to `null` and delete the storage object) so the QA fixtures stay imageless in the documented baseline
4. **Testing note:** this browser automation environment has no way to drive a native OS file-picker dialog. To exercise a file `<input>`, inject a `File` via `DataTransfer` and dispatch a `change` event through `javascript_tool`, then click the real Upload button — this is a standard test technique (equivalent to Playwright's `setInputFiles`), not a UI implementation shortcut.

**Saved opportunities (`/saved`)**
1. As a student, click "☆ Save" on any opportunity card (marketplace list or detail page) — it should flip to "★ Saved"
2. Confirm it shows up at `/saved`
3. Unsave it again before finishing — don't leave scratch saves on the QA student's account

**Multi-user company accounts (`/company/team`)**
More than one person can act for the same company (HR, a hiring manager,
etc.) via `company_members` (who belongs to a company) and
`company_invites` (pending email invites). `companies.profile_id` is still
the company's one permanent identity — nothing about ownership changed,
this is purely an added layer on top. Every company-scoped RLS policy and
action resolves "which company does this user act for" through
`is_company_actor()` (SQL function) / `resolveCompanyId()` (`src/lib/company.ts`)
rather than assuming `company_id === the logged-in user's own id`.

To test the full loop (no permanent 5th QA fixture is kept for this —
create/delete a scratch account each time):
1. Log in as Company A → `/company/team` → invite a scratch email
2. Create that email as a pre-confirmed auth user via the Admin API (same pattern as the other QA fixtures) with `user_metadata.role = "company"`
3. Log in as that new user through the real login form — it should join Company A as a `member` (check `company_members`), **not** create a new company, and mark the invite `accepted_at`
4. As the new member: post an opportunity, confirm `company_id` on the row is Company A's, not the member's own id; open "View applicants" on any of Company A's opportunities and confirm it's visible
5. As Company A (owner): `/company/team` should show both rows; remove the member
6. Delete the scratch account afterward (`DELETE /auth/v1/admin/users/<id>` cascades profile/membership) so it doesn't linger

**Known trap if you touch this area again:** `is_company_actor()` is called from *inside* a SELECT policy on `company_members` itself — it must stay `SECURITY DEFINER` (with `search_path` pinned), or every query against `company_members` recurses into its own RLS policy and Postgres throws "stack depth limit exceeded". Confirmed live during this build. If you ever add a new predicate function that queries the same table its policy protects, assume you need `SECURITY DEFINER` unless you've specifically checked otherwise.

**Request to join an existing company (`/company/onboarding`)**
Phase 3 audit finding: company signup used to unconditionally auto-create a
brand-new company (the signup form's "full name" field doubled as the new
company's name). A second real employee at a company that was already on
ESENet had no way to attach themselves to it — only to accidentally create
a duplicate. `company_join_requests` (`0009`/`0010`) is the fix: a
company-role profile with no company yet lands on `/company/onboarding`
and either creates a new company or searches for and requests to join an
existing one; any actor of the target company approves or declines from
`/company/team`. `provisionProfile()` no longer auto-creates a company when
there's no invite — it just leaves the profile unattached, exactly the
state `/company/onboarding` is built to resolve.

To test the full loop (same "no permanent extra fixture — scratch account,
delete it after" pattern as team invites above):
1. Create a scratch pre-confirmed company-role auth user via the Admin API
2. Log in as it through the real form — first company-gated page hit
   redirects to `/company/onboarding` (not the create-a-company flow of old)
3. Search for an existing company, send a join request with a message
4. As that company (owner or any member): `/company/team` shows a
   "Requests to join" section with the requester's name and message —
   Approve or Decline
5. Approve → the scratch account immediately shows the target company on
   `/company/profile`, no reload/relogin needed for the company side (their
   own next page load resolves through `company_members`, not a cache)
6. Delete the scratch account afterward — cascades the profile, membership,
   and any join-request rows automatically (`company_join_requests.profile_id`
   references `profiles(id) on delete cascade`)

**Bugs found live in this area (fixed):**
- The insert policy on `company_join_requests` only checked
  `profile_id = auth.uid()`, never that the requester is actually a
  company-role profile — confirmed live via direct REST as the QA student,
  which succeeded and created a real row. The app's own `requestToJoinCompany`
  action already blocked this, but per this project's "never rely on
  frontend restrictions" rule, `0010` closes it at the RLS layer too.
- `/company/team`'s new "Requests to join" query used a bare
  `profiles(full_name)` embed, but `company_join_requests` has two foreign
  keys into `profiles` (`profile_id` and `decided_by`) — PostgREST can't
  disambiguate that and rejects the whole query, so the section silently
  never rendered. Same class of bug `fetchPosts()` already hit and fixed
  the same way: name the specific FK to embed through
  (`profiles!company_join_requests_profile_id_fkey(full_name)`).

**Known leftover, not a bug:** there's no RLS delete policy for an already-
`approved`/`declined` `company_join_requests` row (only a still-`pending`
one is deletable, by its own requester) — matching how an accepted
`company_invites` row also has no delete path. A decided request is meant
to stay as a historical record. This means QA testing in this area leaves
one inert, undeletable row per real test run; it never appears in any UI
(the team page only ever queries `status = 'pending'`), so it's harmless,
but don't be surprised it's still in the table.

## Security expectations to re-check

- Logged-out user hitting `/company/dashboard`, `/admin/companies`, or `/applications` → redirected to `/login?next=...`
- Logged-in student hitting `/company/dashboard` or `/admin/companies` → redirected away
- A student cannot create an opportunity (server-side role check in `createOpportunity`, independently enforced by RLS)
- Only a `student`-role profile can create an application (`applyToOpportunity` checks this server-side; RLS enforces it independently too)
- Only a `company`-role profile can insert a `company_join_requests` row (RLS-enforced, not just app-checked)
- A company actor can only insert a `company_members` row for a profile that has an `approved` join request to that exact company — never an arbitrary third party
- An unrelated company/student can't see, approve, or decline a join request addressed to a different company
- `company_id` on an opportunity is always the authenticated user's id — never trust a client-supplied value
- Company B cannot see, edit, or delete Company A's opportunities (RLS via `is_company_actor`)
- Unauthenticated requests cannot insert into `opportunities`
- A company (owner or member) cannot invite themselves into a company they don't belong to, or see another company's members/invites
- A non-owner team member cannot remove another member
- An invited user can only ever see/accept the invite addressed to their own (JWT-verified) email — never someone else's
- **A user cannot self-promote to `admin`**, and **a company cannot self-verify** — both are blocked by DB triggers (`protect_profile_role`, `protect_company_verified` in `0003_security_hardening.sql`), not just RLS. This is load-bearing: RLS alone can restrict *which rows* a "manage my own row" policy touches, not *which columns* — that's why these needed a trigger. If a future column ever needs the same "owner can edit most fields, but not this one" shape, use a trigger, not a cleverer RLS policy.
- A student can only ever move their own application to `withdrawn`; a company can set anything except `withdrawn`. (This was also a real bug once — Postgres ORs `WITH CHECK` across all matching UPDATE policies, so a check on one policy can accidentally be satisfied by another policy's `USING` — always re-embed the identity condition inside every `WITH CHECK`, don't assume it inherits from `USING`.)
- Company B cannot update or delete Company A's posts or comments (verify with direct REST, not just the UI — an RLS-blocked write returns 200/0-rows, never an error)
- A duplicate like (same profile, same post) is rejected at the DB level (`post_likes` primary key), not just by the client hiding the button
- A non-admin cannot set `posts.removed_at`/`removed_by`/`removal_reason` or the equivalent comment fields — only through the admin moderation actions

**Supabase security-advisor state (checked 2026-08-28, after `0020`):**
- `function_search_path_mutable` — **fixed.** `0019` pinned `search_path = public` on `is_admin` + the 7 `protect_*` trigger fns; `0020` tightened all ten project functions (those + `is_company_actor` / `has_application_to`) to `public, pg_temp` — `pg_temp` named explicitly and last, so it's searched after `public` for relation names instead of implicitly before.
- `anon/authenticated_security_definer_function_executable` on `is_company_actor` / `has_application_to` — **accepted, not a bug.** They're RLS-policy predicates; `authenticated` (and `anon`, for the OR'd public policies) must keep `EXECUTE` or every query against the protected tables fails. Each only ever reflects the *caller's own* access (`auth.uid()` vs. their own memberships/applications), so direct `/rpc/` callability leaks nothing. Moving them to a private schema is the only real silencer and isn't worth the multi-policy rewrite.
- `rls_auto_enable` (event-trigger fn, `ensure_rls`) — same lint, benign: an event-trigger function can't be meaningfully called via `/rpc/`.
- `auth_leaked_password_protection` disabled — enable in the dashboard (Authentication → Providers), one toggle.
- A user can only read/update/delete their **own** `notifications` rows. The INSERT policy (`0015`) is deliberately loose: any authenticated user can create a notification *for someone else* with a truthful `actor_id` (their own, or null) and never targeting themselves. **Known, accepted for launch** — every real call site is a server action that already did its own authz; the residual abuse is "an authed user POSTs a junk notification to another user, attributed to themselves". They can't read it back, can't forge a third-party actor, can't self-target. A future pass can swap this for a `SECURITY DEFINER` RPC that re-checks the actor↔recipient relationship per `notification_kind`.

## Notifications (`/notifications`, header bell — `0015`)

In-app only — no email or push (that's a separate, not-yet-built piece).
One `notifications` table, one row per recipient per event. Rows are written
**best-effort from the server actions that already perform the mutation**
(`notify()` in `src/lib/notifications.ts`) — same "app code inserts, RLS is
the real boundary" shape as `application_status_events`, deliberately not a
trigger. `notify()` never throws and never blocks its caller: an application
still submits even if pinging the company fails. It dedups recipients and
drops the actor from the list (you're never notified of your own action).
Company-directed events fan out to every actor of the company via
`companyActorIds()` (owner + members, all of whom have a `company_members`
row since `0004`'s backfill).

Wired events (`notification_kind`): `application_received`,
`application_status_changed`, `application_withdrawn`,
`join_request_received`, `join_request_approved`, `join_request_declined`,
`ownership_transfer_proposed`, `post_comment`.

The header bell shows the unread count (capped display at `9+`). Opening
`/notifications` fires `markAllNotificationsRead()` once on mount — it
revalidates the layout (so the bell clears everywhere) but **not** the
`/notifications` route, so the list you're looking at keeps its unread
highlighting until you navigate away and back. There's also a manual "Mark
all read" button.

**Degrades before the migration is applied:** `unreadNotificationCount()`
and `fetchNotifications()` both return `0` / `[]` on a query error rather
than throwing, so the header (rendered in the root layout) and every page
keep working if `0015` hasn't run yet.

To test: log in as the QA student, apply to Company A's fixture opportunity,
then log in as Company A and check the bell + `/notifications`. Reverse for
status changes. Clean up any scratch applications afterward per the apply-flow
rules above.

## Full regression checklist

### Auth
- [ ] Company A can log in
- [ ] Company B can log in
- [ ] Student can log in
- [ ] `/forgot-password` → submitting any email shows the same "if that email has an account…" message (no account-existence leak)
- [ ] The reset email link lands on `/auth/callback`, exchanges, forwards to `/reset-password` with a session; setting a new password (min 8, must match confirm) works and the old one stops working
- [ ] An expired / already-used reset link → `/reset-password` shows "invalid or expired" + "Request a new link"; a bad `code` on `/auth/callback` bounces to `/login?error=…`
- [ ] **Needs Supabase dashboard:** `<prod-origin>/auth/callback` and `http://localhost:3000/auth/callback` are in Authentication → URL Configuration → Redirect URLs, or the email link errors out

### Company
- [ ] Company A reaches dashboard
- [ ] Company B reaches dashboard
- [ ] Company A sees only Company A's opportunities
- [ ] Company B sees only Company B's opportunities
- [ ] An invited team member joins the inviting company (not a new one) on first login
- [ ] A team member can post/manage opportunities attributed to the right company
- [ ] Only the owner can remove a team member; a non-owner member cannot
- [ ] A fresh company-role signup with no invite lands on `/company/onboarding`, not an auto-created company
- [ ] "Create a new company" on that page works and lands on `/company/profile`
- [ ] Searching for an existing company and requesting to join creates a pending request, visible to that company on `/company/team`
- [ ] Approving a request immediately grants membership (visible on both sides without a relogin); declining does not
- [ ] A company-role profile that already belongs to a company can't create or request a second one through this page (it redirects away instead)

### Opportunity
- [ ] Company can open the create form
- [ ] Required-field validation works
- [ ] Opportunity can be published
- [ ] Database row is created with the right `company_id` and `status = published`
- [ ] Student marketplace displays the published opportunity
- [ ] Opportunity detail page displays correctly
- [ ] `/opportunities` paginates at 20 per page; filters/sort survive across Previous/Next
- [ ] Signed in as a student **with skills on the profile**, on the unfiltered first page of `/opportunities`: a "Recommended for you" block appears above the list with up to 4 published opportunities whose `skills` overlap the student's (case-insensitive), ranked by overlap count, each showing "N skills match · skill, skill". Past-deadline opportunities are excluded. The block does not show when filtering/searching, past page 1, for a student with no skills, or for a company/anon viewer. (`fetchRecommendedOpportunities` in `src/lib/opportunities.ts`.)
- [ ] **Not verified with a real login** (no QA student password): the rendered block. Verified: the `&&` overlap query returns the right rows at the SQL level, no regression on the anon/company `/opportunities` view, lint + build clean. The current QA fixture (student skill `Power BI`, only opp skill `SQL`) has zero overlap, so it exercises the empty path; add a shared skill to see the populated block.
- [ ] `/opportunities/[id]` shows a "Similar opportunities" list (up to 3 other published opps sharing a skill, ranked by overlap, past-deadline excluded, itself excluded); hidden when the opp is closed or there are no matches. `fetchSimilarOpportunities` in `src/lib/opportunities.ts`. Verified in-browser with a throwaway second opportunity (shared skill `SQL`) that was then deleted — the block appeared then disappeared cleanly.
- [ ] Applying a second time to the same opportunity fails with a friendly message, not a raw database error

#### Application deadline (`0022` — additive `opportunities.application_deadline date`, not security-sensitive, APPLIED)
- [ ] Create form: an application-deadline date in the past is rejected ("can't be in the past"); a future date or blank is accepted
- [ ] Edit form prefills the existing deadline; a past date is **allowed on edit** (deliberate early close) and immediately closes applications
- [ ] Opportunity detail: a future deadline shows "Apply by <date>"; once passed it shows "Applications closed on <date>" and the apply form is replaced by a closed notice (a student who already applied still sees "You've applied")
- [ ] `/opportunities` list: an opportunity whose deadline is within 7 days shows a red "Closes <date>" badge
- [ ] Company dashboard: each opportunity row shows "Applications close/closed <date>" when a deadline is set
- [ ] Server guard: a direct POST to `applyToOpportunity` for a past-deadline or non-published opportunity returns a friendly error and writes no row (verified via stale page / direct call — cannot be exercised through the UI once the form is hidden)
- [ ] **Not verified with a real login** (no QA student password available to me): the end-to-end "student clicks Apply before/after deadline" path. Backing SQL + the detail-page render for null / past / soon deadlines were checked directly against the dev DB.

### robots.txt / sitemap.xml
- [ ] `/robots.txt` allows `/`, disallows `/students`, `/profile`, `/company/`, `/admin/`, `/notifications`, `/applications`, `/saved`, `/reset-password`, `/auth/`, and points at `/sitemap.xml`
- [ ] `/sitemap.xml` lists the static public routes plus every **published** opportunity (`lastmod` = created_at) and every **verified** company; regenerates hourly (`revalidate = 3600`); reads via the cookie-less public client
- [ ] Verified in-browser against live dev DB (1 opportunity + 2 companies present, correct absolute URLs from `NEXT_PUBLIC_SITE_URL` / Vercel fallback)

### Page metadata / link previews
- [ ] Root layout sets `metadataBase` (`NEXT_PUBLIC_SITE_URL` or the Vercel URL fallback) and a `%s · ESENet` title template
- [ ] `/opportunities/[id]` `<title>` = "<title> — <company> · ESENet"; `og:title` = "<title> · <type> at <company>"; `og:description` = first 200 chars of the description; a closed/unpublished or missing id → title just "Opportunity"
- [ ] `/companies/[id]` `<title>` = "<company> · ESENet"; `og:title`/`og:description` set from the company name + description
- [ ] Verified in-browser against live dev DB (both titles + all `og:` tags present and correct); lint + build clean

### Home page (`/`)
- [ ] Hero shows a live "N open roles · N partner companies" line (published opportunities / verified companies counts; hidden entirely if Supabase isn't configured)
- [ ] "Latest opportunities" strip shows up to 4 most-recent published opportunities linking to their detail pages; hidden when there are none
- [ ] Reads run through `createPublicClient()` (cookie-less anon) — the page adds no auth dependency; verified against live dev DB ("1 open role · 2 partner companies", BI PFE listed)

### Public company directory (`/companies`)
- [ ] Lists **verified** companies only (unverified never appear), each with logo/initial, description snippet, and an open-role count (published opportunities); sorted by open-role count desc then name
- [ ] `?q=` filters by company name (ILIKE); "Clear" resets
- [ ] No login needed; "Companies" nav link points here; each card links to `/companies/[id]`
- [ ] Verified: renders against the live dev DB (Company A "1 open role" first, Company B "No open roles right now"), name search narrows to one, `<title>` = "Companies · ESENet" (layout template), lint + build clean

### Public company profile (`/companies/[id]`)
- [ ] Renders (no login needed) for a verified company: logo/banner/description, "Verified" badge, website link, its published opportunities, and the team ("Name · Title", owner marked)
- [ ] An unverified company still renders (row is public) but shows "Not yet verified" and no opportunities
- [ ] A non-company id 404s
- [ ] The company name on an opportunity's detail page and on company posts in the feed link here

### Opportunity edit / close (`0017`)
- [ ] Dashboard shows Edit + Close/Reopen per opportunity; `/company/opportunities/[id]/edit` prefills every field and saves ("Changes saved." banner)
- [ ] A team member (not just the owner) can edit and close — `is_company_actor`, not owner-only
- [ ] Editing another company's opportunity by URL 404s (ownership-scoped fetch + RLS)
- [ ] Closing removes the opportunity from `/opportunities` and 404s its public detail page for non-applicants; reopening restores both
- [ ] After `0017`: a student who already applied still sees the opportunity title/company on `/applications` even once it's closed (not the "Opportunity" / "ESEN partner company" placeholder)
- [ ] `updateOpportunity` never changes `company_id` or `status`; `setOpportunityStatus` only moves between `published` and `closed`

### Applicant review (`0018`)
- [ ] The applicants page shows each applicant's headline + skill chips inline, a "Full profile →" link to `/students/[id]`, and a "View CV (PDF) →" link when they uploaded one
- [ ] The CV link opens a working signed URL (private `cvs` bucket, 10-min expiry)
- [ ] After `0018`: a company **team member** (not just the owner) can open applicant CVs — pre-`0018` the link just doesn't render for them (per-path signed-URL error is swallowed), it never 403s in the user's face
- [ ] An applicant with no CV / no `student_details` row still renders cleanly (name + status only)

### Application
- [ ] Student can apply
- [ ] Application row is created, referencing the correct student and opportunity
- [ ] Company can view applicants on its own opportunity and update status
- [ ] Status change is reflected on the student's `/applications` view
- [ ] Status change is logged in `application_status_events`
- [ ] Student can withdraw; company cannot set a status to `withdrawn`
- [ ] Only a `student`-role account can create an application
- [ ] `/applications/[id]` (from the "Details & status history" link, or the
      `application_status_changed` notification): shows the opportunity +
      company links, a status timeline seeded with a synthetic "Applied" entry
      from `applications.created_at` plus each `application_status_events` row
      ("by you" vs "by the company"), the cover message if any, and a Withdraw
      button only while the status is still open (applied/reviewed/shortlisted/
      interview)
- [ ] Another student's application id at `/applications/[id]` → `notFound()`
      (RLS + the explicit `student_id !== user.id` guard)
- [ ] Company dashboard: an opportunity with untriaged applications (still at
      `applied`) shows an "N new" badge next to the applicant count
- [ ] Company applicants view: each card has a collapsible "Status history"
      disclosure (Applied + every `application_status_events` row)
- [ ] Migration `0021` (applied 2026-08-28 via MCP — nullable
      `application_status_events.note` + `application_status_events_note_len`
      check). Company status update with a note filled in:
      the note is stored on the `application_status_events` row (≤1000 chars,
      `application_status_events_note_len` check), shown quoted in the company
      history disclosure, shown in a callout on the student's
      `/applications/[id]` timeline, and included in the
      `application_status_changed` notification body. Empty note → unchanged
      behaviour.

### Trust & verification
- [ ] Admin can see pending/verified companies at `/admin/companies`
- [ ] Admin approving a company makes its published opportunities publicly visible
- [ ] A company cannot self-verify (direct API attempt must fail)
- [ ] A non-admin cannot flip another company's `verified` flag

### Admin overview (`/admin`, `0016`)
- [ ] `/admin` loads for an admin, redirects a non-admin/logged-out user away
- [ ] "Needs attention" surfaces pending companies + open reports, each linking to its queue; absent when both are zero
- [ ] After `0016`: opportunity and application counts are non-zero when data exists; before `0016` those tiles read 0 and the page still renders
- [ ] The nav "Admin" link points to `/admin`; `/admin/companies` and `/admin/reports` each have a "← Admin overview" backlink
- [ ] Direct REST as a non-admin: `is_admin()`-gated SELECT on `opportunities`/`applications` returns only the rows the pre-existing public/owner policies already allowed (0016 is additive, OR'd)

### Security
- [ ] Student cannot access `/company/dashboard` or `/admin/companies`
- [ ] Student cannot create an opportunity
- [ ] Company A cannot access Company B's opportunities (and vice versa)
- [ ] `company_id` cannot be spoofed from the client
- [ ] Unauthenticated users cannot create opportunities
- [ ] A user cannot self-promote their `profiles.role` to `admin`
- [ ] A company cannot set its own `verified` to `true`
- [ ] RLS remains enabled on all tables

### Student profile
- [ ] The "Profile N% complete" nudge lists exactly the missing items and disappears at 100% (9 checks: photo, headline, bio, ≥1 skill, looking-for, availability, CV, education, experience-or-project)
- [ ] Core profile fields save
- [ ] CV upload accepts PDF, rejects other types and files over 5MB
- [ ] CV is only readable by its owner and by any actor (owner or member, `0018`) of a company the student applied to — private bucket, verify a third company gets nothing via direct Storage API
- [ ] Education/Experience/Projects/Certifications can be added and removed, scoped to the owning student

### Student directory (`/students`, `/students/[id]`)
- [ ] Logged out: `/students` and `/students/[id]` show a "log in" gate, not data
- [ ] Logged in (any role): the directory lists students who have filled in a profile; a bare student_details row (no headline/bio/skills) does NOT appear
- [ ] A deactivated (deleted) account never appears in the directory or opens as a profile
- [ ] Keyword / skill / "looking for" / available-now filters each narrow the list; filters survive Previous/Next; 20 per page
- [ ] `/students/[id]` shows headline, bio, skills, looking-for, availability, LinkedIn, the four history sections, and the student's feed posts — but NOT their CV
- [ ] A company viewing an applicant on `/company/opportunities/[id]/applicants` can click the name through to `/students/[id]`
- [ ] Pages are `robots: noindex`

### Saved opportunities
- [ ] Student can save/unsave from the marketplace list and from an opportunity's detail page
- [ ] `/saved` reflects the current saved set

### Feed / posts / moderation
- [ ] A student and a company (owner and a team member) can each publish a post
- [ ] A company post shows the company identity; a team member's personal post shows `Name · Title · Company`; title renders for viewers outside the company too
- [ ] Like/unlike works; a duplicate like is rejected at the DB level
- [ ] Comment create works; the author sees `Delete` on their own comment only
- [ ] Admin sees `Remove (admin)` on someone else's comment (soft delete, audit trail) — never on their own
- [ ] Deleting/removing a comment updates the visible list immediately, no reload needed
- [ ] Reporting a post creates an open row in `/admin/reports`; Mark resolved / Dismiss transitions it correctly
- [ ] Admin `Remove (admin)` on a post soft-deletes it (audit trail kept) and hides it from everyone but the author/admin
- [ ] Company B cannot modify or delete Company A's post/comment via direct REST
- [ ] Post author sees an "Edit" affordance under their own post body (not on others'); editing the text and/or link and saving updates the post in place and adds an "edited" marker (`updated_at !== created_at`)
- [ ] The edit form closes on its own after a successful save (no reload); Cancel discards changes
- [ ] `editPost` is body + link only — it cannot change `published_as` / `company_id` / attached opportunity or project (the `protect_post_admin_fields` trigger freezes attribution), and a non-author / removed post → "You can't edit this post"
- [ ] **Not verified with a real login** (no QA password available to me): the actual in-browser Edit → Save round trip. Verified: the card renders with the new client `PostBody` component, the "edited" marker appears once `updated_at` moves, lint + build clean. Backing RLS ("authors edit their own post") + the trigger already existed — no migration.
- [ ] Comment author sees "Edit" next to "Delete" on their own comment; editing updates it in place and adds "· edited" (`post_comments.edited_at`, migration `0023` — additive nullable column, APPLIED); the edit form closes on save, Cancel discards
- [ ] `editComment` is body-only, scoped to `author_id` + non-removed; a non-author / removed comment → "You can't edit this comment"; the `protect_comment_admin_fields` trigger passes `edited_at` through untouched (checked directly via SQL: an UPDATE setting `body` + `edited_at` keeps both, freezes `author_id`/`post_id`)
- [ ] **Not verified with a real login**: the in-browser comment Edit → Save round trip (verified the feed renders the edited comment + "· edited" marker via a throwaway SQL fixture, since removed).

### Notifications (`0015`, header bell + `/notifications`)
- [ ] Student applies → every actor of the target company gets an `application_received` notification linking to that opportunity's applicants page
- [ ] Company changes an application's status → the student gets `application_status_changed` linking to `/applications`
- [ ] Student withdraws → company actors get `application_withdrawn`
- [ ] Someone requests to join a company → company actors get `join_request_received`; approve/decline → the requester gets `join_request_approved` / `join_request_declined`
- [ ] Owner proposes an ownership transfer → only the named member gets `ownership_transfer_proposed`
- [ ] Someone comments on a post → the post author (only, and not if it's their own comment) gets `post_comment`
- [ ] The header bell shows the unread count; opening `/notifications` clears it (marks all read) but the list keeps highlighting what was unread for that view
- [ ] A user can only ever see their own notifications (direct REST as another user returns `[]`)
- [ ] Direct REST: an authenticated user can create a notification for *another* user (known, documented — see below) but NOT for themselves, NOT with a forged `actor_id`, and cannot read anyone else's back
- [ ] Header + `/notifications` still render (as "0" / empty) before `0015` is applied — the read helpers degrade, they don't throw

### Quality
- [ ] `npm run lint`
- [ ] `npm run build`

### Mobile
- [ ] No horizontal scroll on any core page at 375px width
- [ ] Every link/button has a real tap target (~32px+ for list actions, ~40px for primary nav) — not just its bare text line-height

### Account deletion
- [ ] Student deletion removes CV/avatar storage files, `student_details` and its children, keeps the profile as an anonymized tombstone
- [ ] A post/comment/application belonging to a deleted account still renders, now attributed to "Deleted user"
- [ ] A non-owner company member can leave without deleting their account, and can delete their account (auto-leaving) in one step
- [ ] A company owner cannot delete their account, server-side, not just hidden in the UI
- [ ] `deactivated_at`, `full_name`, `avatar_url`, `banner_url` are all frozen once deactivated — direct REST attempts to change any of them revert

### Ownership transfer
- [ ] Owner can propose a transfer to an existing member; only one in flight per company
- [ ] Only the named recipient sees an Accept/Decline offer; nobody else does
- [ ] Decline leaves `company_members` completely untouched
- [ ] Accept swaps both rows — recipient becomes owner, outgoing owner becomes member (not removed)
- [ ] A mere member cannot initiate a transfer (RLS, not just hidden in the UI)

## Posts / feed / moderation (`/feed`, `/admin/reports`)

A single global, chronological feed (`fetchPosts()` in `src/lib/posts.ts`) that
both students and companies (owner or any team member) publish to. Reuses
the existing multi-tenant company model rather than a parallel one:
`published_as` on a post is `'self'` or `'company'`; when `'company'`, the
`company_id` is server-resolved (`resolveCompanyId`) and checked with the
same `is_company_actor()` used everywhere else — never trusted from the
client. One level of comments (no threads), a simple `post_likes` table with
a composite `(post_id, profile_id)` primary key as the DB-level duplicate-like
guard, and `content_reports` feeding `/admin/reports`. No permanent QA
fixture posts are kept — the account list above is reused, but every post/
comment/like/report created while testing this area should be deleted again
afterward (see cleanup note below), same "leave it clean" discipline as
every other section in this file.

**Identity rendering:** a company post shows `Company Name` (+ Verified
badge); a personal post by a company team member shows
`Name · Title · Company Name` (title from `company_members.title`, set by
that member at `/company/profile`); a student's post shows
`Name · headline`. `company_members` has been publicly readable since
`0008` specifically so this title renders for *any* viewer, not just people
inside the company.

To test the full loop:
1. Log in as any account, publish a post from `/feed` (text + optional
   image/link; image goes to the public `post-media` bucket)
2. Log in as a different account (ideally the QA student, to check the
   "outside viewer" case) and confirm the post appears with the right
   identity line and title
3. Like it, confirm the count updates; attempt a duplicate like via direct
   REST insert on `post_likes` — must 409 on the primary key
4. Comment as a couple of different accounts
5. As the comment's own author: **Delete** — hard delete, no audit trail,
   correct for removing your own content
6. As admin, on someone else's comment: **Remove (admin)** — soft delete
   (`removed_at`/`removed_by`), preserves the row for audit; must appear
   for admin-on-others'-comments and must never appear next to your own
   comment (that stays a plain Delete)
7. Report a post as the student (reason `other` is fine), confirm it shows
   under **Open** at `/admin/reports`, then **Mark resolved** / **Dismiss**
   and confirm it moves to the resolved section and `content_reports.status`
   updates in the DB
8. As admin, **Remove (admin)** a post with a reason — confirm the row gets
   `removed_at`/`removed_by`/`removal_reason` (not deleted), the author and
   admin can still see it marked "Removed", and it's invisible to everyone
   else (including the other company)
9. As Company B, attempt to update/delete Company A's post or comment via
   direct REST (not just the UI) — must be a no-op (RLS-blocked writes
   return 200/0-rows, not an error — check the row is actually unchanged,
   don't just trust the HTTP status)
10. Clean up: hard-delete every post created above via admin ("admins
    delete any post" cascades its comments/likes/reports), reset any
    `company_members.title` you set back to `null`, sign out

**Bugs found live in this area (fixed):**
- `company_members` had an UPDATE policy gap — no permissive UPDATE policy
  at all meant `updateMyTitle()` silently no-opped (PostgREST returns
  `error: null` / 0 rows for an RLS-blocked write, not an error) while the
  UI reported "Saved ✓". Fixed in `0007_company_member_title_update.sql`
  (member can update their own row; `company_id`/`profile_id`/`role` locked
  immutable by trigger).
- `company_members` only had `is_company_actor()`-scoped SELECT — a
  member's `title` (and the whole "Name · Title · Company" feed identity
  line) was invisible to anyone outside that company, i.e. the feed's
  actual target audience. Fixed in `0008_company_members_public_read.sql`
  (public read, write stays owner/actor-scoped — same pattern as every
  other glanceable table).
- `RemoveCommentButton` (the admin soft-delete-with-audit-trail component)
  was never actually rendered anywhere — `comment-section.tsx` showed the
  self-serve hard-delete `DeleteCommentButton` to admins for *any* comment,
  including other people's, so admin comment moderation always destroyed
  the row instead of soft-deleting it. Fixed in `comment-section.tsx`: an
  author sees `Delete` only on their own comment; an admin sees
  `Remove (admin)` only on someone else's.
- Deleting/removing a comment didn't reflect in the list until a full page
  reload — the client component's local `comments` state was seeded once
  from `initialComments` and never reconciled with the fresh server data a
  revalidation sends down. Fixed by adjusting state during render when
  `initialComments` changes (the pattern React's own docs recommend for
  this, and what `react-hooks/set-state-in-effect` otherwise flags),
  instead of a `useEffect`.

## Known infrastructure note

Supabase's default email confirmation is enabled on this project. Because of
that, `signUp()` cannot create the `profiles`/`companies`/`student_details`
row immediately (no session exists yet) — profile provisioning is
intentionally deferred to first successful login instead (see
`src/app/actions/auth.ts`). Don't "fix" this by disabling email confirmation
or by reverting to immediate provisioning at signup — that regresses real
signups. Also: the project's default mailer has a low send-rate limit: don't
mass-create test accounts through the signup UI, since that spends real
confirmation emails and can hit the limit.

## Phase 3 hardening (production-readiness audit)

Two fixes from the Phase 3 production-readiness audit, neither changing
behavior a real user would notice:

- **`applyToOpportunity` no longer leaks the raw Postgres error** to the
  client on failure (it used to — every other action in this codebase logs
  server-side and returns a friendly message; this one was the exception).
  The UI already hides the apply form once `alreadyApplied` is true, so the
  realistic trigger for this path is a race (double-submit), not normal
  use — live-verified by pattern/build only, not by deliberately forcing a
  duplicate against the QA student's real baseline application (QA.md's
  own rule above: never re-apply as a new row against that fixture).
- **`0011_missing_fk_indexes.sql`** adds indexes on foreign-key columns
  that had none: `opportunities.company_id`, `applications.student_id`,
  `company_members.profile_id`, `post_likes.profile_id`,
  `company_invites.company_id`/`email`, `saved_opportunities.opportunity_id`.
  Postgres never auto-indexes a FK column, only a table's own primary key —
  invisible at QA-fixture scale, real once there's actual data volume.
  Purely additive, no behavior change.
- **`/opportunities` now paginates** at 20 per page instead of fetching
  every published opportunity in one unbounded query — verified live by
  temporarily bulk-inserting 22 scratch rows, confirming page 1/page 2
  split correctly (including with a filter applied, preserved across
  Previous/Next), then deleting all 22 and confirming the baseline
  ("Business Intelligence PFE Intern") was untouched.

## Mobile audit (375×812 + 768×1024)

Every QA pass before this one ran at a fixed desktop viewport — this was
the first real check at mobile/tablet widths, using the Browser pane's
device emulation and DOM measurement (`getBoundingClientRect`,
`scrollWidth` vs `innerWidth`) rather than eyeballing screenshots (the
emulator's screenshot canvas includes letterboxing outside the device
frame, which looks like a layout bug at a glance but isn't — verify with
the DOM, not the screenshot proportions).

**Result: no horizontal-overflow bugs found** on any of the 16 routes
checked at 375px, or on `/opportunities` and `/feed` re-checked at 768px.

**One real, systemic bug found and fixed: near-zero tap targets.** Nearly
every plain text link/button in the app (`font-mono text-xs ...` with no
padding of its own) rendered at **16px tall** — the header nav, "+ Add" /
"Remove" on profile sections, Like/Delete/Report/Remove(admin) on the
feed, "Team →" / "View applicants →" on the company dashboard, "Clear
filters" / "Browse opportunities →" on empty states, and more — found via
a `getBoundingClientRect` sweep of `main a, main button` on each page,
not a visual guess. 16px is a menu-bar-in-1995 hit target, not a phone
one (WCAG 2.5.5 and every mobile platform's own guidance calls for
~40-44px). Fixed by adding `py-2`/`py-2.5`/`py-3` (chosen per element:
~32px for dense secondary actions in lists, 40px for primary header nav)
to every instance found across `src/components` and `src/app` — padding
only, no visual redesign, confirmed with an eslint+build pass and
re-measured live after the fix. The two skill-chip "×" remove buttons
(inherently tiny, part of a small tag) got `-m-1 p-1` instead — expands
the invisible tap area without changing the chip's visual size at all.

**Known tooling limitation, not an app bug:** the Browser pane's
`computer` click/tap action reliably times out once mobile-device
emulation is active (touch-event synthesis appears to hang) — `form_input`
and `javascript_tool`-driven `requestSubmit()` both work fine in the same
mode. All mobile-viewport testing after that point used
`form_input`/JS-submit instead of simulated taps, so **real touch-tap
interaction itself was not exercised by automation** at mobile widths —
only layout, overflow, and tap-target sizing were. Worth a manual check on
a real phone (or a differently-configured mobile emulator) before
launch, specifically for anything with custom pointer/touch handling.

## Account deletion (`/profile`, `/company/profile`)

Phase 3 audit item 8. Anonymize-and-deactivate, not a hard delete —
`profiles.id` IS `auth.users.id` (the primary key doubles as the FK), so
deleting the auth row cascades and destroys the profile, which cascades
further into every comment/application/post that references it,
destroying OTHER people's legitimate records as collateral (a comment
thread someone else is part of, a company's own hiring record). Instead:

- The profile survives as a tombstone (`full_name` → "Deleted user",
  images cleared) so existing content still renders correctly for
  whoever legitimately holds it.
- Everything purely personal — CV, education/experience/projects/
  certifications (all cascade from deleting `student_details`), saved
  opportunities — is actually removed, storage files included.
- `profiles.deactivated_at` is set (one-way, trigger-enforced — see the
  bug below) and the session is signed out immediately.
- A company **owner** is blocked from deleting outright — see "Known gap"
  below.
- A company **member** (non-owner) deleting their account is auto-removed
  from `company_members` as part of the same action; **leaving** a
  company (`/company/profile` → "Leave [company]") is offered separately,
  for someone who wants to detach without deleting their whole account.

**Known, disclosed limitation:** there's no way to block login at the
Supabase Auth layer itself without a service-role key or introspecting
`auth.users`' exact schema (e.g. a `banned_until` column, version-
dependent) — neither of which this action has/does. A "deleted" account
can still authenticate; it just has nothing left to see or do beyond a
blank, anonymized, deactivated profile. Confirmed live: logging back in
with the same credentials after deletion succeeds (200 on the token
grant), landing on an empty profile.

**Known, deliberate gap: no self-service ownership transfer.**
`company_members.role` is trigger-locked immutable (0007) specifically to
close two real privilege-escalation bugs from earlier in this project —
relaxing that trigger to allow "owner promotes a member to owner" is
real, security-sensitive scope of its own, not something to bolt onto an
unrelated account-deletion feature under time pressure. A sole owner who
wants to delete their account or close their company needs to contact
ESEN directly for now. The UI states this plainly rather than offering a
broken or half-working transfer flow.

**Bug found live, fixed (0013):** `deactivated_at` was correctly one-way
(0012's trigger blocks clearing it), but nothing stopped the account from
continuing to update `full_name`/`avatar_url`/`banner_url` afterward —
confirmed by logging back in as a just-deleted scratch account and
successfully PATCHing `full_name` back to a real-looking name via direct
REST. That defeated the entire point of the tombstone: anyone could
"undelete" their own visible identity immediately. Fixed by freezing
those three fields too, the same "old.X is not null → freeze X" shape,
once `deactivated_at` is already set.

To test the full loop (four scratch accounts needed — a student with
real content, a company owner, and two non-owner members — created via
the Admin API and fully deleted afterward, same as every other scratch-
account pattern in this file):
1. Student: populate CV, education, a project, an avatar, a post, and
   have a different account comment on that post. Delete the account.
   Confirm: CV/avatar files actually gone from storage, student_details
   and its children gone, profile shows "Deleted user" with
   `deactivated_at` set, the post and the other account's comment on it
   are both still there and still render correctly, and any application
   the student had submitted is untouched (check via the owning
   company's own view — admin has no read policy on `applications` at
   all, so an empty result there proves nothing either way)
2. Company member (non-owner): "Leave company" — confirm the
   `company_members` row is gone but the profile is completely
   untouched (not anonymized, `deactivated_at` still null)
3. A different member: "Delete my account" directly — confirm this
   auto-removes their `company_members` row AND anonymizes the profile
   in one step
4. Company owner: confirm the delete button doesn't even render, and
   that the underlying action would refuse it server-side too — the
   check lives in `deleteMyAccount()` itself, not just the UI
5. As the deactivated account, attempt to clear `deactivated_at` or
   change `full_name`/`avatar_url`/`banner_url` via direct REST — all
   four must revert (0013)

## Company ownership transfer (`/company/team`)

The gap `deleteMyAccount()` left deliberately open (0012/0013): a sole
owner blocked from deleting had no way to hand the company to a team
member first. Doesn't touch `protect_company_member_identity`'s
role-immutability trigger (0007) at all — that trigger only fires on
`UPDATE`, so this is built entirely on `DELETE`-then-`INSERT` instead,
the same consent-record shape `company_join_requests` already uses: a
`company_ownership_transfers` row captures the owner naming a member and
that member's own acceptance, and every `company_members` write an
accepted transfer authorizes is narrowly gated by that exact row existing
— never a general "owners can reassign roles" grant.

**Reminder if you ever query this:** `company_members.company_id` is the
company's permanent identity (`companies.profile_id`) — it never changes
on a transfer. Only which row has `role = 'owner'` moves. Confirmed live
by initially querying the wrong id after a transfer and getting a
correct-but-confusing empty/blocked result — that was a test-script
mistake, not a bug, but easy to repeat.

To test the full loop (three scratch accounts: an owner and two
members):
1. Owner: `/company/team` → "Make owner" on a member → confirm a
   "Waiting on X to accept" row appears with Cancel, and every member
   row's "Make owner" button disappears while one transfer is pending
   (only one in flight per company, enforced by a partial unique index)
2. The named member: sees an "wants to make you the owner" card with
   Accept/Decline — a third member (not named) sees nothing
3. Decline path: confirm the transfer's `status` becomes `declined` and
   `company_members` is completely untouched
4. Accept path: confirm the five-step swap completed — the accepting
   member is now `owner`, the outgoing owner is now `member` (not
   removed), everyone else is untouched, and the pending-transfer
   section disappears for the (former) owner
5. As the new owner, confirm you can immediately initiate a new
   transfer yourself — proves the mechanism is fully reusable, not a
   one-time swap
6. Direct REST: a mere member attempting to initiate (should 403 — not
   owner), an unrelated party's `select` (should return `[]` — no
   visibility), a second pending transfer while one's already in flight
   (should 409 — unique constraint)

**Bug found live, fixed:** `TeamMemberRow`'s "hide on success" check
covered both the remove-member action AND the initiate-transfer action
with one shared condition — so successfully proposing a transfer made
that *member's own row* vanish from the Members list entirely (they're
still a member; only the "Make owner" button should have disappeared).
Confirmed the underlying data was never touched — purely a client-side
render bug, caught immediately by comparing the UI against a direct
`company_members` query showing all three rows intact. Fixed by scoping
the hide-on-success behavior to the remove action only.
