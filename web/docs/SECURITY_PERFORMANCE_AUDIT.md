# Security & performance audit — findings log

Running list of issues found in passing during other work. **Report only** —
nothing here has been fixed. Each entry: what it is, why it matters, where it
lives, and a suggested direction (not a decision).

Ordered newest first.

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

## Also tracked (not yet written up)

- **Every route renders dynamically because the root layout's `SiteHeader`
  calls `cookies()`.** `/privacy`, `/terms`, `/cookies` and other static
  content pages do a Supabase round-trip per request as a result. Flagged
  2026-08-29; belongs in this doc, full write-up pending.
