# ESENet Talent Fair 2026 — OC Operations Platform

Internal recruitment and assignment platform for the **ESENet Talent Fair 2026 Organizing Committee**, run by **[ESEN Ambassadors](https://ambassadors.tn)**.

Production domain: **https://esenet-oc.ambassadors.tn**

```
APPLICATION → REVIEW → SELECTION → SKILL ANALYSIS → MISSION ASSIGNMENT → TEAM ASSIGNMENT → J-2 / J-1 / JOUR J
```

- **Students** apply once: identity, skills, experience, profile, and a mandatory commitment to all three operational days (J-2, J-1, Jour J). They never choose a mission.
- **Ambassadors** review applications, shortlist and select people, see deterministic mission recommendations, and assign each selected person a mission, a team and an optional role.
- **Admins** also manage missions, teams, staff accounts, settings, skills and CSV exports.
- Every decision is written to an **audit log** (who, what, when, before → after).

---

## Contents

1. [Requirements](#1-requirements)
2. [Installation](#2-installation)
3. [Environment variables](#3-environment-variables)
4. [PostgreSQL setup](#4-postgresql-setup)
5. [Prisma setup](#5-prisma-setup)
6. [Database migration](#6-database-migration)
7. [Seed database](#7-seed-database)
8. [Local development](#8-local-development)
9. [Authentication setup](#9-authentication-setup)
10. [Production deployment](#10-production-deployment)
11. [Vercel deployment](#11-vercel-deployment)
12. [Custom domain configuration](#12-custom-domain-configuration)
13. [DNS configuration](#13-dns-configuration)
14. [Database production configuration](#14-database-production-configuration)
15. [File storage configuration](#15-file-storage-configuration)
16. [Security notes](#16-security-notes)
17. [How to create the first Admin](#17-how-to-create-the-first-admin)
18. [How to manage Ambassadors](#18-how-to-manage-ambassadors)
19. [How to back up the database](#19-how-to-back-up-the-database)
- [Skill matching algorithm](#skill-matching-algorithm)
- [Architecture](#architecture)
- [Routes](#routes)
- [Product rules → where they're enforced](#product-rules--where-theyre-enforced)
- [Known limitations & decisions](#known-limitations--decisions)

---

## 1. Requirements

| Tool | Version |
|---|---|
| Node.js | 20.9+ (developed on 24) |
| npm | 10+ |
| PostgreSQL | 14+ (any provider: Neon, Supabase-hosted Postgres is **not** used, Railway, RDS, local) |

Stack: Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · shadcn/ui (Radix) · Motion · Prisma 7 (`@prisma/adapter-pg`) · Auth.js v5 (Credentials, JWT sessions) · Zod 4 · React Hook Form · Lucide · Vercel Blob (optional) · Nodemailer (optional).

## 2. Installation

```bash
git clone <your-repo-url> esenet-oc
cd esenet-oc
npm install
cp .env.example .env
```

`npm install` does not need a database. `npm run build` runs `prisma generate` first, so the generated client in `src/generated/prisma` (git-ignored) is always fresh.

## 3. Environment variables

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string used by the running app. In production use your provider's **pooled** URL. |
| `DIRECT_URL` | No | Direct (non-pooled) URL used only by the Prisma CLI (`migrate`, `seed`, `studio`). Falls back to `DATABASE_URL`. |
| `DATABASE_POOL_MAX` | No | Max DB connections per app instance. Default `5`. Keep small on serverless. |
| `AUTH_SECRET` | **Yes** | Signs/encrypts session tokens. Generate: `npx auth secret` or `openssl rand -base64 33`. Changing it signs everyone out. |
| `NEXTAUTH_URL` | **Yes** | Canonical app URL — `http://localhost:3000` locally, `https://esenet-oc.ambassadors.tn` in production. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Same value as `NEXTAUTH_URL`; used for metadata and absolute links. |
| `BLOB_READ_WRITE_TOKEN` | No | Enables the optional CV upload (private Vercel Blob store). Empty → the CV field is hidden. |
| `EMAIL_SERVER` | No | SMTP URL for confirmation emails, e.g. `smtp://user:pass@smtp.example.com:587`. Empty → no emails, nothing breaks. |
| `EMAIL_FROM` | No | Sender, e.g. `ESEN Ambassadors <oc@ambassadors.tn>`. Required together with `EMAIL_SERVER`. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | No | One-time first admin creation during `db:seed`. Prefer `npm run admin:create`. Delete after use. |

Nothing secret is hardcoded anywhere. `.env*` files are git-ignored (only `.env.example` is committed).

## 4. PostgreSQL setup

Any PostgreSQL 14+ works. Options:

- **Local:** install PostgreSQL, then `createdb esenet_oc` and set
  `DATABASE_URL="postgresql://postgres:<password>@localhost:5432/esenet_oc"`.
- **Docker:** `docker run --name esenet-oc-db -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=esenet_oc -p 5432:5432 -d postgres:17`
- **Hosted (recommended for production):** Neon via the Vercel Marketplace (see §14) — it injects `DATABASE_URL` and an unpooled URL into the Vercel project automatically.

## 5. Prisma setup

- Schema: `prisma/schema.prisma`. Config (datasource URL, migrations path, seed command): `prisma.config.ts`.
- Prisma 7 uses the **driver adapter** `@prisma/adapter-pg` — no Rust query engine at runtime, which keeps the Vercel bundle small.
- Generate the client after any schema change: `npm run db:generate` (also done by `npm run build`).
- Inspect data: `npm run db:studio`.

## 6. Database migration

Migrations live in `prisma/migrations/` and are committed.

```bash
# Development — create/apply migrations from schema changes
npm run db:migrate           # = prisma migrate dev

# Production / CI — apply committed migrations only (never generates new ones)
npm run db:deploy            # = prisma migrate deploy
```

The initial migration (`20261005000000_init`) also contains hand-written constraints Prisma can't express:

- `CHECK ("availabilityConfirmed" = true)` — an application without the full 3-day commitment cannot exist.
- `CHECK (email = lower(btrim(email)))` — emails are always stored normalized.
- Partial unique index: one **active** assignment per candidate per mission.
- Non-negative capacities, skill weights 1–3, singleton settings row.

## 7. Seed database

```bash
npm run db:seed
```

Idempotent and **safe in production**: it only creates *configuration* — the 18 skills, 6 default teams, 10 default missions with recommended skills, the 3 operational days (J-2 / J-1 / JOUR J, dates left empty) and the settings row. It never creates candidates and never overwrites rows you've edited in the admin.

Starting capacities are placeholders — set the real numbers in **Teams** and **Missions**.

**Demo candidates (development only):**

```bash
npm run demo:seed    # 40 fake candidates, isDemo = true, emails @demo.invalid, tagged DEMO in the UI
npm run demo:clear   # removes all of them (and their assignments)
```

The demo script refuses to run when `NODE_ENV=production` or `VERCEL_ENV=production`. Never run `demo:seed` against the production database; run `demo:clear` if you ever did.

## 8. Local development

```bash
npm run db:deploy      # or db:migrate
npm run db:seed
npm run admin:create -- --email you@example.com --name "Your Name"
npm run dev            # http://localhost:3000
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (webpack) |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (Next config + React Compiler rules) |
| `npm run typecheck` | `tsc --noEmit` |

> **Windows note:** scripts pass `--webpack` because some locked-down Windows machines block the native SWC/Turbopack binary. On Vercel and normal machines you can drop the flag if you prefer Turbopack.

## 9. Authentication setup

- **Staff only.** Applicants never log in. Every route under `/admin/*` (plus `/api/cv/*` and `/api/export/*`) requires a staff session.
- **Auth.js v5**, Credentials provider, **JWT session** (12 h), httpOnly + `Secure` cookies in production, CSRF protection on the Auth.js endpoints and Origin checks on Server Actions (built into Next.js).
- Passwords are hashed with **bcrypt (cost 12)**. No plaintext is ever stored or logged.
- **Defence in depth:**
  1. `src/proxy.ts` (Next 16 "middleware") bounces requests without a session cookie to `/admin/login`.
  2. Every page calls `requireStaff()` / `requireAdmin()` (`src/lib/auth.ts`), which re-reads the user from the database on each request — a disabled account or a changed role takes effect immediately, even with a valid token.
  3. Every server action calls `actor()` / `actor({ admin: true })` again before touching data.
- **Login rate limiting:** 8 attempts / 15 min per account and 30 / 15 min per IP (Postgres-backed, works across serverless instances). Response timing doesn't reveal whether an email exists.
- Roles: **ADMIN** (everything) and **AMBASSADOR** (review, select, assign, plan the schedule, operations notes). See [§18](#18-how-to-manage-ambassadors).

Set `AUTH_SECRET` and `NEXTAUTH_URL` (see §3). Nothing else is required — no OAuth app.

## 10. Production deployment

Checklist:

1. Provision PostgreSQL (§14) and note the pooled and direct URLs.
2. Apply migrations to production: `DIRECT_URL="<direct url>" npm run db:deploy`.
3. Seed configuration: `DIRECT_URL="<direct url>" DATABASE_URL="<direct url>" npm run db:seed`.
4. Create the first admin (§17).
5. Deploy to Vercel (§11) with the environment variables from §3.
6. Connect `esenet-oc.ambassadors.tn` (§12–13).
7. Sign in, set the operational dates (Settings), the real team/mission capacities, and add the Ambassadors' accounts.
8. Smoke test: submit a test application from a phone, review it, select, assign, check Operations — then reject it or delete it via Prisma Studio.

> This repository has **not** been deployed by its author. Nothing here claims the production site is live — follow the steps above and verify.

## 11. Vercel deployment

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. Vercel → **Add New → Project** → import the repository.
3. Framework preset: **Next.js** (auto-detected). Root directory: the folder containing `package.json`.
4. **Build command:** leave the default (`npm run build`, which runs `prisma generate && next build`). Install command: default.
5. **Environment variables** (Project → Settings → Environment Variables), for *Production* (and *Preview* if you use previews — ideally with a separate database):
   - `DATABASE_URL` (pooled), `DIRECT_URL` (unpooled), `AUTH_SECRET`, `NEXTAUTH_URL=https://esenet-oc.ambassadors.tn`, `NEXT_PUBLIC_APP_URL=https://esenet-oc.ambassadors.tn`
   - Optional: `BLOB_READ_WRITE_TOKEN`, `EMAIL_SERVER`, `EMAIL_FROM`
6. Deploy.
7. **Migrations:** run `npm run db:deploy` against production *before* (or right after) deploying a version that includes new migrations. Either run it from your machine/CI with `DIRECT_URL` set, or override the Production build command to `npx prisma migrate deploy && npm run build` (only do this if Preview deployments use a different database).
8. Region: put the Vercel functions in the same region as the database (Project → Settings → Functions → Region), e.g. `fra1` with a Frankfurt database — the closest to Tunisia.

HTTPS certificates are issued and renewed automatically by Vercel.

## 12. Custom domain configuration

The domain cannot be configured from the codebase — it's done in Vercel and in the DNS of `ambassadors.tn`.

1. Vercel → Project → **Settings → Domains** → add `esenet-oc.ambassadors.tn`.
2. Vercel shows the DNS record it expects (normally a `CNAME`). Create it at the DNS provider of `ambassadors.tn` (§13).
3. Wait until Vercel shows **Valid Configuration** and issues the SSL certificate (minutes to a few hours, depending on DNS TTL).
4. Make sure `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` are exactly `https://esenet-oc.ambassadors.tn`, then **redeploy** so the new values are used.
5. Optional: keep the `*.vercel.app` URL for previews; the production domain should be the canonical one.

## 13. DNS configuration

At whoever hosts DNS for `ambassadors.tn` (registrar or DNS provider), add:

| Type | Name / Host | Value | TTL |
|---|---|---|---|
| `CNAME` | `esenet-oc` | `cname.vercel-dns.com` *(use the exact target Vercel shows for your project)* | 3600 (or Auto) |

Notes:
- Only this subdomain changes; `ambassadors.tn` and its other records are untouched.
- If the zone has a `CAA` record, it must allow `letsencrypt.org` or Vercel can't issue the certificate.
- Verify propagation: `nslookup esenet-oc.ambassadors.tn` (or `dig esenet-oc.ambassadors.tn CNAME`).
- If Vercel asks for a `TXT` verification record (domain already used in another Vercel account), add it as shown.

## 14. Database production configuration

Recommended: **Neon** through the Vercel Marketplace (Vercel → Storage → Create Database → Neon). It adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` to the project — copy the unpooled value into `DIRECT_URL`.

Guidance for any provider:
- App traffic → **pooled** URL (`DATABASE_URL`), with `sslmode=require`.
- Migrations / seed → **direct** URL (`DIRECT_URL`).
- Keep `DATABASE_POOL_MAX` small (default 5) — each serverless instance has its own pool.
- Choose a region close to Tunisia (Frankfurt / EU-Central) and the same region for Vercel functions.
- The expected size is tiny (hundreds of applications); a free/hobby tier is enough. CVs are **not** stored in Postgres.
- Enable your provider's automatic backups / point-in-time restore (§19).

## 15. File storage configuration

CV upload is **optional** and **off** unless `BLOB_READ_WRITE_TOKEN` is set.

1. Vercel → Storage → **Create → Blob**, connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN`.
2. Redeploy. The CV field appears on the application form.

How it's protected:
- Only PDF, max **3 MB**, checked client-side **and** server-side, including the `%PDF-` file signature (the declared MIME type isn't trusted).
- Uploaded with **`access: "private"`** — there is no public URL. The database stores only the blob pathname.
- Staff open CVs through `/api/cv/<candidateId>`, which checks the staff session, streams the file with `Cache-Control: private, no-store`, and writes `candidate.cv_viewed` to the audit log.
- If the database write fails after upload (e.g. duplicate email), the orphaned blob is deleted.

## 16. Security notes

- **Validation:** one Zod schema (`src/lib/validation/application.ts`) validates the form on the client *and* is re-run on the server; every staff action has its own Zod schema. Inputs are trimmed, whitespace-normalized and control characters stripped before storage. React escapes all output (no `dangerouslySetInnerHTML`); external links are restricted to `http(s)` and opened with `rel="noopener noreferrer nofollow"`.
- **Duplicates:** emails are trimmed + lowercased in code **and** enforced by a unique index + a `CHECK` constraint; a race between two submissions is caught on the unique violation.
- **Public endpoint abuse:** Postgres-backed rate limit on applications (30 / 10 min per IP — generous because a whole campus can share one Wi-Fi IP — and 6 / hour per email), a hidden honeypot field, a 40 KB payload cap and a 4 MB body cap.
- **Errors:** database errors are logged server-side only; the public sees friendly messages; staff actions return "Nothing was changed — please try again".
- **Headers** (`next.config.ts`): CSP (`default-src 'self'`, no framing, `object-src 'none'`), `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, HSTS, restrictive Permissions-Policy, `no-store` + `noindex` on `/admin` and `/api`.
- **Privacy:** the success page reads the new application ID from a 1-hour httpOnly cookie — never from the URL — so nobody can look up an application by guessing IDs. Raw IPs/emails are never stored in the rate-limit table (salted SHA-256). Candidate data is only visible to signed-in staff; CSV export is admin-only and audited. A public privacy notice lives at `/privacy` — **ESEN Ambassadors should review its wording (contact channel, retention) before launch.**
- **No hard deletes from the UI:** candidates are rejected, not deleted; assignments are ended, not deleted. Schedule items can be removed (their full content is kept in the audit log).
- **CSV injection:** exported cells that start with `=`, `@`, or a non-numeric `+`/`-` are prefixed with `'`.
- **Dependencies:** `npm audit --omit=dev` reports two advisories inside the Prisma **CLI** (`deepmerge-ts`, `mysql2`) — build-time tooling only, not reachable from user input; nodemailer is pinned to the patched v10 line via `overrides`.

## 17. How to create the first Admin

```bash
# Against the database in DATABASE_URL / DIRECT_URL:
npm run admin:create -- --email you@ambassadors.tn --name "Your Name"
```

A strong temporary password is generated and printed **once**. Sign in at `/admin/login`, then change it in **My account**. To choose the password yourself: `ADMIN_PASSWORD='at-least-12-chars' npm run admin:create -- …`.

Lost the password? `npm run admin:create -- --email you@ambassadors.tn --reset`.

(Alternative: set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` for one `npm run db:seed` run, then remove them.)

## 18. How to manage Ambassadors

Admin → **Settings → Staff accounts**:

- **Add staff** — name, email, role (Ambassador or Admin). A temporary password is shown once; send it privately. They change it in **My account**.
- **Change role** — Ambassador ⇄ Admin.
- **Disable** — the switch cuts access immediately (sessions are re-checked against the database on every request). Accounts are disabled, not deleted, so the audit trail keeps names.
- **Reset password** — issues a new temporary password.
- Safety rails: you can't demote or disable yourself, and the last active admin can't be removed.

| Capability | Ambassador | Admin |
|---|:-:|:-:|
| View candidates & CVs, change status, notes, contact flags | ✓ | ✓ |
| Assign / reassign / unassign missions & teams | ✓ | ✓ |
| Schedule (J-2 / J-1 / JOUR J), Operations notes | ✓ | ✓ |
| View teams & missions | ✓ | ✓ |
| Create / edit teams, missions, recommended skills | | ✓ |
| Settings (applications open/closed, dates, rules), skills, staff | | ✓ |
| CSV export, full audit log | | ✓ |

## 19. How to back up the database

- **Provider backups (primary):** enable automatic backups / point-in-time restore on your Postgres provider (Neon keeps history for its restore window; check the plan).
- **Manual dump** (before the event, and before risky changes):
  ```bash
  pg_dump "$DIRECT_URL" --format=custom --no-owner --file="esenet-oc-$(date +%F).dump"
  ```
- **Restore** into an empty database:
  ```bash
  pg_restore --no-owner --dbname="$TARGET_DATABASE_URL" esenet-oc-YYYY-MM-DD.dump
  ```
- **Spreadsheet snapshot:** Admin → Candidates → **Export CSV** (respects the current filters).
- Backups contain personal data — store them encrypted and delete them when no longer needed.

---

## Skill matching algorithm

Deterministic, in-process, no AI/external API. Source: `src/lib/matching.ts`.

Each mission lists recommended skills with a **weight**: `1` useful · `2` core · `3` critical (edited in **Missions**).

For candidate **C** and mission **M**:

```
totalWeight   = Σ weights of M's skills
matchedWeight = Σ weights of M's skills that C ticked
skillFit      = min(1, matchedWeight / (0.6 × totalWeight))     # covering 60% of the weighted skills = full fit
experience    = 0.6 × [C organised events before] + 0.4 × [C took part in ESEN / Ambassadors / ESENet activities]
score         = round(100 × (0.85 × skillFit + 0.15 × experience))     # 0 if no skill matches at all
```

- Nobody is expected to have *every* skill a mission lists — hence the 60% saturation.
- Experience only separates people who already fit: zero matching skills ⇒ 0%.
- Ties: more core-skill matches first, then mission order. Same inputs ⇒ same ranking.
- The UI shows the matched and missing skills next to each score, plus live mission capacity, so the reasoning is visible.
- The score at the moment of assignment is stored on the assignment (`scoreAtAssignment`) for accountability.

**It is only a recommendation.** Ambassadors pick the mission, team and role; nothing is auto-assigned.

Example — candidate with *Organization, Teamwork, Leadership, Photography* and event experience, against the default missions: Room Management 80%, Speaker Management 70%, Coordination 70%, Photography / Video 66%, Logistics 56%.

## Architecture

```
prisma/
  schema.prisma            data model (see below)
  migrations/              committed SQL migrations (+ hand-written constraints)
  seed.ts                  idempotent reference data
scripts/
  create-admin.ts          first admin / password reset
  demo-candidates.ts       DEMO fixtures (dev only)
src/
  proxy.ts                 optimistic auth gate for /admin, /api/cv, /api/export
  auth.ts, auth.config.ts  Auth.js v5 (Credentials, JWT)
  app/
    (public)/              landing, /apply, /application/success, /privacy
    admin/login            staff sign-in
    admin/(staff)/         dashboard, candidates, assignments, teams, missions,
                           schedule, operations, settings, audit, account
    api/cv/[candidateId]   private CV streaming (staff only)
    api/export/candidates  CSV export (admin only)
  actions/                 typed server actions, one file per domain
  components/
    ui/                    shadcn/ui primitives (restyled to the ESENet tokens)
    admin/, apply/, public/, brand/, form/
  lib/
    db.ts                  Prisma client (pg driver adapter)
    auth.ts                requireStaff / requireAdmin / actor
    action.ts              guarded() wrapper — friendly errors, no DB leaks
    audit.ts               audit log writer (transaction-aware)
    matching.ts            recommendation algorithm (pure)
    rate-limit.ts          Postgres fixed-window limiter
    storage.ts, email.ts   optional integrations
    services/              read-side queries (candidates, stats, matching, days, settings)
    validation/            shared Zod schemas
  hooks/use-action.ts      client helper: pending state + toast + refresh
```

**Data model:** `User` (staff) · `Candidate` · `Skill` · `CandidateSkill` · `Mission` · `MissionSkill` (weighted) · `Team` · `Assignment` (active/ended, linked to the assignment it replaced) · `ScheduleDay` (J-2/J-1/JOUR J) · `ScheduleItem` + `ScheduleItemPerson` · `OperationsNote` · `AppSetting` · `AuditLog` · `RateLimit`.

**Design system:** tokens in `src/app/globals.css`, derived from the official *Data Alchimie* palette (midnight navy scale, ESEN azure `#2DA5E9`, off-white `#FAFAFC`) and the 2026 ESENet logo gradient (blue `#2463D2` → cyan `#14AAD7` → green `#55E274`; gold `#E0B04D` is used only for "attention" states). Fonts: Archivo (expanded, display), Manrope (UI), IBM Plex Mono (labels/data). Logos in `public/brand/` are the official files, not redrawn.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | Public | Landing |
| `/apply` | Public | 5-step application (Profile → Skills → Experience → Commitment → Review) |
| `/application/success` | Public | Confirmation with application ID |
| `/privacy` | Public | Privacy notice |
| `/admin/login` | Public | Staff sign-in |
| `/admin` | Staff | Dashboard: stats, pipeline, 3-day commitment, team capacity, activity |
| `/admin/candidates` | Staff | Table/cards, filters, search, sort, pagination, quick status, CSV (admin) |
| `/admin/candidates/[id]` | Staff | Full profile, status actions, recommendations, assignment, notes, audit history |
| `/admin/assignments` | Staff | Workspace: selected list → recommendations → assign; who-is-where board |
| `/admin/teams` | Staff (edit: admin) | Teams, capacity, leaders, members |
| `/admin/missions` | Staff (edit: admin) | Missions, recommended skills & weights, capacity |
| `/admin/schedule` | Staff | J-2 / J-1 / JOUR J planning (time, mission, team, people, location, notes) |
| `/admin/operations` | Staff | Event-day screen: current day, now/next, leaders + phones, unassigned, people to contact, notes; auto-refresh |
| `/admin/settings` | Admin | Applications open, assignment rule, current-day override, dates, staff, skills |
| `/admin/audit` | Admin | Full audit log with before/after values |
| `/admin/account` | Staff | Change own password |

## Product rules → where they're enforced

| Rule | Enforcement |
|---|---|
| 1. Available all three days | Form can't advance; Zod `refine` server-side; DB `CHECK` constraint |
| 2. Candidates don't choose tasks | No mission field anywhere in the public form or schema |
| 3. Candidates provide skills & experience | Relational `CandidateSkill`; experience questions |
| 4. Ambassadors choose assignments | Only staff actions create `Assignment` rows |
| 5. Recommendations only | `src/lib/matching.ts`; nothing auto-assigns |
| 6. Assignments editable | Reassign / edit role / unassign |
| 7. Audit history | `AuditLog` written in the same transaction as each change; reassignment links old → new |
| 8. Selected people get assigned | `assignCandidate` rejects non-SELECTED; un-selecting ends active assignments |
| 9–10. Real PostgreSQL, no Supabase | Prisma + `pg` |
| 11–12. Vercel, `esenet-oc.ambassadors.tn` | §11–13 |

## Known limitations & decisions

- **No separate `Experience` table.** The spec's candidate fields (`eventExperience`, `eventExperienceDetails`, `ambassadorExperience`, `ambassadorExperienceDetails`) are stored on `Candidate`. With exactly two fixed yes/no questions, a second table would only duplicate them. If the form later gains a repeatable "experiences" list, add a table then.
- **TanStack Table not used.** Sorting, filtering and pagination happen in SQL on the server (so thousands of rows are never loaded); a client table library would add weight without adding capability here.
- **Team leaders** are OC members flagged *Team leader* on their assignment; each team can also have one *Ambassador in charge* (a staff account).
- **Rate limits** fail open if the database is unreachable (the write would fail anyway); tune the numbers in `src/actions/application.ts` and `src/auth.ts`.
- **Email** is SMTP via Nodemailer and sent after the response (`after()`), so a slow mail server never delays the applicant. Only the "application received" email exists; status-change emails are intentionally not sent (selection is communicated by the team).
- **Times** in the schedule are plain `HH:MM` strings; "now/next" on the Operations screen uses Africa/Tunis time.
- **Local testing on locked-down Windows:** if native PostgreSQL DLLs are blocked by application control, [PGlite](https://pglite.dev) works as a stand-in (`npx -p @electric-sql/pglite-socket pglite-server --db=./.pgdata --port=5544 --max-connections=4`) — set `DATABASE_POOL_MAX=1`, because PGlite serves one query stream at a time.
