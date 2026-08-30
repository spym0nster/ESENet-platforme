# Security & performance audit — findings log

Running list of issues found in passing during other work. **Report only** —
nothing here has been fixed. Each entry: what it is, why it matters, where it
lives, and a suggested direction (not a decision).

Ordered newest first.

---

## F5 · Signup was broken in production for ~3 days, two independent ways

**Severity:** critical (nobody could create an account — the top of the funnel)
**Area:** auth / signup / email hook
**Found:** 2026-08-30, reported by Bilel; diagnosed from `auth_logs` + the
deployed route + `auth.users`
**Status:** cause 2 (this hook) fixed in code + fail-open (`… commit`); both
still need env vars set (QUEUE.md). Cause 1 (CAPTCHA) was a dashboard toggle.

### What

`auth.users` holds **4 rows, all from 2026-08-27** — the QA fixtures. Zero
real accounts have been created since. Over the 24h `auth_logs` window
(2026-08-29 → 08-30) **every single `/signup` request failed**, in two phases:

1. **`captcha_failed` (400)** — Supabase Auth's "Enable Captcha protection"
   was turned on in the dashboard, but the signup form sends no CAPTCHA
   token (there is no CAPTCHA code anywhere in the repo — `git log -S captcha`
   / `hcaptcha` / `Turnstile` all empty). Every signup 400'd. This is a
   dashboard setting, not git-traceable; Bilel has since disabled it.
2. **`unexpected_failure` (500)** — with CAPTCHA off (~08-30 08:00), the
   Send Email Hook takes over and returns 500:

   ```
   $ curl -i -X POST https://esenet-platforme.vercel.app/api/auth/email-hook -d '{…}'
   HTTP/1.1 500 Internal Server Error
   {"error":{"http_code":500,"message":"Email hook is not configured."}}
   ```

   `auth_logs`: `{"action":"run_hook","hook":"https://esenet-platforme.vercel.app/api/auth/email-hook","msg":"Hook errored out","error":"500: Unexpected status code returned from hook: 500"}`
   → `user_confirmation_requested` returns `500 unexpected_failure` and GoTrue
   **rolls back the `auth.users` insert.** Fails closed.

The route returns that 500 from its own guard: `SEND_EMAIL_HOOK_SECRET` is
**not in the Vercel Production environment** (it exists only in Preview,
alongside `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` — F1). The hook
route landed `6ad46ed` (2026-08-29 12:53); it has 500'd on every prod signup
since the dashboard hook was pointed at it.

### Why it matters

Beyond "no signups for 3 days": the email hook was a **hard, synchronous
dependency on account creation** with no fallback. A Resend outage, a bad
deploy, a typo in the secret — any of them would have done the same thing.
Email delivery failing should never prevent an account from existing.

### Where

- `web/src/app/api/auth/email-hook/route.ts` — the route (now fail-open)
- Vercel project `esenet-platforme` → Environment Variables → **Production**
- Supabase → Authentication → Providers → "Enable Captcha protection" (was on)
- Supabase → Authentication → Hooks → Send Email Hook (points at the prod URL)

### Update 2026-08-30

Env vars set + secrets rotated + confirmation re-enabled. Signup for the
Resend account-owner address now works end to end (verified via password
reset). **But a signup with any *other* address still fails on the
deployed site:** the old route (fail-open fix committed, not deployed)
returns **502** — `EMAIL_FROM` is Resend's `onboarding@resend.dev`, which
only delivers to the account owner until a domain is verified, so Resend
rejects the send and the old route treats that as fatal. Reproduced:
signup with `onboarding.test.student.c1@gmail.com` → 502, `auth.users` row
rolled back. **Deploy the fail-open route** (and verify a real domain in
Resend + set `EMAIL_FROM`) to fix signup for everyone, not just the owner.

### Fix / direction

- **Done in code:** the route now fails open — the only non-200 it returns is
  a verified-bad signature (401). Missing config / Resend down / malformed
  payload / any throw → logged, 200, account created, email recoverable via
  resend.
- **Still required (QUEUE.md — needs Bilel):** add `SEND_EMAIL_HOOK_SECRET`
  and `RESEND_API_KEY` to Vercel **Production** (currently Preview-only).
  Until then signup *succeeds* but the confirmation email doesn't send, and
  with email-confirmation ON the user can't log in — so this is not fully
  resolved without the env vars.
- **Consider:** a monitored alert on "auth email send failed" (right now it's
  a `console.error` nobody watches), and whether email confirmation should be
  relaxed / an admin-confirm path should exist for when delivery fails.
- **Process:** two prod-down auth changes (a dashboard CAPTCHA toggle, a hook
  wired up without its env var) shipped without anyone attempting a signup
  afterward. `web/docs/QA.md` has an auth regression flow — it wasn't run.

---

## F1 · Notification emails are silently off in production

**Severity:** medium (a whole feature is dark in prod, with no signal)
**Area:** notifications / email
**Found:** 2026-08-29, during the dev-environment setup

### What

The in-app → email mirror in `notify()` is gated on
`isEmailConfigured() && isAdminConfigured()`
([`src/lib/notifications.ts:60`](../src/lib/notifications.ts)). `isAdminConfigured()`
requires `SUPABASE_SERVICE_ROLE_KEY`.

On the deployed **Production** environment that variable **is not set at all**
(`vercel env ls` shows `SUPABASE_SERVICE_ROLE_KEY` only in *Preview*, added
~2026-08-29 08:00; Production has only the two `NEXT_PUBLIC_SUPABASE_*` vars).

So in production every call to `notify()` inserts the in-app notification row
(that happens *before* the guard, on the request client) and then skips the
email block entirely. No email is sent when:

- an application's status changes (student gets nothing)
- someone comments on a post
- a company team invite / join request is actioned
- any other `notify()` path fires

### Why it matters

This is the documented graceful-degradation path — `CLAUDE.md` and
`.env.local.example` both say "absent that key, notifications stay in-app only;
nothing breaks" — so it is **not a crash**. But the product intent is that
recipients get an email, and right now nobody does, with no error, no log line,
and no admin-visible signal. A student who applied and never opens the site
again never learns they were shortlisted.

### Where

- `src/lib/notifications.ts:60` — the guard
- `src/lib/supabase/admin.ts` — `isAdminConfigured()` / `createAdminClient()`
- Vercel project `esenet-platforme` → Settings → Environment Variables

### Suggested direction

Add a real `service_role` key to the Production environment (Supabase →
Project Settings → API → `service_role`), then verify one end-to-end send.
Relatedly, see F2 — the guard should also refuse to run with a key that isn't
actually a service-role key.

---

## F2 · `isAdminConfigured()` cannot tell a service-role key from an anon key

**Severity:** medium (fails silent, wastes work, produces error-log noise, and
masks misconfiguration — which is exactly how it went unnoticed)
**Area:** notifications / email / config validation
**Found:** 2026-08-29

### What

`isAdminConfigured()` is a presence check on a non-empty string:

```ts
// src/lib/supabase/admin.ts:16
return Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
);
```

It returns `true` for **any** truthy value — including the publishable/anon key.
`createAdminClient()` then builds a Supabase client with whatever that value is
and hands it to `resolveUserEmails()`, which calls `auth.admin.getUserById()`.

If the value is not a real service-role key, every one of those admin calls is
rejected by the API, caught at `src/lib/supabase/admin.ts:47`, and logged as
`resolveUserEmails: getUserById failed for <id>`. `notify()` then sends zero
emails. All best-effort, nothing throws to the user — but it is pure waste plus
one error line per recipient per notification.

### Why it matters

This is precisely why `web/.env.local` sat misconfigured
(`SUPABASE_SERVICE_ROLE_KEY` set to the **anon** key) without anyone noticing:
the app reported itself as "email configured" and quietly failed every send.
A config check that can't distinguish a working key from a broken one is worse
than no check — it converts a loud startup failure into silent runtime rot.

### Where

- `src/lib/supabase/admin.ts:16-20` — `isAdminConfigured()`
- `src/lib/supabase/admin.ts:22-32` — `createAdminClient()`
- `src/lib/supabase/admin.ts:42-51` — the per-id failure swallow

### Suggested direction

Whatever the fix, **it should fail loudly**, not silently. Options, roughly in
order of effort:

- Cheap heuristic: reject a value that starts with `sb_publishable_` or that
  decodes to a JWT with `"role":"anon"`. Log an explicit
  `SUPABASE_SERVICE_ROLE_KEY looks like an anon key` at boot.
- Better: on first use, do one throwaway `auth.admin` call behind a cached
  promise; if it 401s, log a hard error once and disable the mirror for the
  process (so you don't spam the logs) — but make that disable *visible*.
- Best: a `/api/health` or admin-panel line that surfaces "email mirror: on /
  off / misconfigured" so it's observable without reading logs.

---

## F3 · `student_details` is fully public-read, with no visibility control

**Severity:** high (personal data of every student, no opt-out, no gate on read)
**Area:** RLS / privacy / student data
**Found:** 2026-08-29, while speccing onboarding

### What

`student_details` and its four child tables (`education`, `experiences`,
`projects`, `certifications`) each carry a `SELECT using (true)` policy — from
`schema.sql:86` and `0002_platform_phase2.sql` §6. Every row is readable by
anyone with a valid anon/authed key. There is **no `visible` / `discoverable` /
`is_public` column anywhere**, so a student has no way to opt out of being
listed and read.

The app layer softens this a little — `/students` and `/students/[id]` gate on
`auth.getUser()` and won't render for anonymous visitors — but that is a UI
convention, not a policy. A logged-in user (any role, including a freshly
self-signed-up one) can read every student's headline, bio, skills,
availability, LinkedIn, and full education/experience/project history straight
from PostgREST, `/students` page or not.

Onboarding does **not** change this and is not the place to fix it: I told
Bilel a visibility control already existed when speccing the flow — it does
not. The onboarding spec (`ONBOARDING.md` §2) now says plainly that profiles
are simply public-read once onboarded.

### Why it matters

Before real students (not QA fixtures) are on the platform, someone has to
decide: is a student profile public to all signed-in users by default, opt-in,
or opt-out? Right now it's "public to all signed-in users, no choice", which is
a defensible product decision for a talent marketplace but has never actually
been *decided* — it's just the default `using (true)` nobody revisited. The CV
is correctly private (separate bucket, applicant-scoped policy); the rest of
the profile is wide open.

### Where

- `schema.sql:86` — `"student details are publicly readable"`
- `0002_platform_phase2.sql` §6 — the same policy on `education` /
  `experiences` / `projects` / `certifications`
- `src/lib/students.ts` — the app-layer `auth.getUser()` gate that is doing all
  the actual access control today

### Suggested direction

A product decision first, then a policy. If "opt-out": add
`student_details.listed boolean not null default true`, tighten the SELECT
policy to `listed = true or auth.uid() = profile_id`, and give onboarding +
`/profile` the toggle. If "signed-in only is fine": at minimum change the
policies from `using (true)` to `using (auth.role() = 'authenticated')` so the
app-layer gate is backed by RLS. Not onboarding's job either way.

---

## F4 · `updateStudentProfile` nulls every column it doesn't receive

**Severity:** medium (live data-loss bug in `/profile` today, not hypothetical)
**Area:** server actions / data integrity
**Found:** 2026-08-29, while speccing onboarding

### What

`updateStudentProfile` (`src/app/actions/student-profile.ts:34`) reads
`headline`, `bio`, `looking_for`, `availability`, `linkedin_url`, and `skills`
from the FormData and writes **all six** on every call:

```ts
.update({
  headline: headline || null,
  bio: bio || null,
  looking_for: lookingFor || null,
  availability: availability || null,
  linkedin_url: linkedinUrl || null,
  skills,
})
```

Any caller that submits a subset silently blanks the rest. Today only
`StudentProfileForm` calls it, and that form does post all six fields — so the
bug is latent. But it is one partial `<form>`, one `fetch`, or one future
caller away from wiping a student's bio because the request only carried a new
headline. The onboarding spec has to route around it (`ONBOARDING.md` §2, §10).

### Why it matters

It makes the action unsafe to reuse, which is why the onboarding spec proposes
refactoring it to a partial update. Independent of onboarding, it's a
data-integrity landmine: the function's contract ("update the profile") does
not match its behaviour ("replace the profile with whatever fields this request
happened to include").

### Where

- `src/app/actions/student-profile.ts:34-77` — `updateStudentProfile`
- `src/components/student-profile-form.tsx` — the only current caller

### Suggested direction

Write only keys present in the FormData: build the update object dynamically,
`if (formData.has('headline')) patch.headline = …`, etc. `StudentProfileForm`
is unaffected (it always sends every field). This is the refactor
`ONBOARDING.md` §10 already calls for; doing it as a standalone fix first would
de-risk the onboarding work.

---

## Also tracked (not yet written up)

- **Every route renders dynamically because the root layout's `SiteHeader`
  calls `cookies()`.** `/privacy`, `/terms`, `/cookies` and other static
  content pages do a Supabase round-trip per request as a result. Flagged
  2026-08-29; belongs in this doc, full write-up pending.
