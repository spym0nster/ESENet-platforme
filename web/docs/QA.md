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

## Security expectations to re-check

- Logged-out user hitting `/company/dashboard`, `/admin/companies`, or `/applications` → redirected to `/login?next=...`
- Logged-in student hitting `/company/dashboard` or `/admin/companies` → redirected away
- A student cannot create an opportunity (server-side role check in `createOpportunity`, independently enforced by RLS)
- Only a `student`-role profile can create an application (`applyToOpportunity` checks this server-side; RLS enforces it independently too)
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

## Full regression checklist

### Auth
- [ ] Company A can log in
- [ ] Company B can log in
- [ ] Student can log in

### Company
- [ ] Company A reaches dashboard
- [ ] Company B reaches dashboard
- [ ] Company A sees only Company A's opportunities
- [ ] Company B sees only Company B's opportunities
- [ ] An invited team member joins the inviting company (not a new one) on first login
- [ ] A team member can post/manage opportunities attributed to the right company
- [ ] Only the owner can remove a team member; a non-owner member cannot

### Opportunity
- [ ] Company can open the create form
- [ ] Required-field validation works
- [ ] Opportunity can be published
- [ ] Database row is created with the right `company_id` and `status = published`
- [ ] Student marketplace displays the published opportunity
- [ ] Opportunity detail page displays correctly

### Application
- [ ] Student can apply
- [ ] Application row is created, referencing the correct student and opportunity
- [ ] Company can view applicants on its own opportunity and update status
- [ ] Status change is reflected on the student's `/applications` view
- [ ] Status change is logged in `application_status_events`
- [ ] Student can withdraw; company cannot set a status to `withdrawn`
- [ ] Only a `student`-role account can create an application

### Trust & verification
- [ ] Admin can see pending/verified companies at `/admin/companies`
- [ ] Admin approving a company makes its published opportunities publicly visible
- [ ] A company cannot self-verify (direct API attempt must fail)
- [ ] A non-admin cannot flip another company's `verified` flag

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
- [ ] Core profile fields save
- [ ] CV upload accepts PDF, rejects other types and files over 5MB
- [ ] CV is only readable by its owner and companies the student applied to (private bucket)
- [ ] Education/Experience/Projects/Certifications can be added and removed, scoped to the owning student

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

### Quality
- [ ] `npm run lint`
- [ ] `npm run build`

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
