# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ESENet — project context

ESENet is ESEN's (École Supérieure de l'Économie Numérique, Manouba, Tunisia)
annual Talent Fair. This project turns it into a year-round digital platform:
students, alumni, companies and startups connected all year, not just on
event day. Full vision: see `Note Conceptuelle.pdf` and `Dossier Sponsoring.pdf`
in this folder. Pitch deck: `esenet-2027-pitch.html` (open directly, or it's
published as a Claude Artifact).

**Deadline: the next Talent Fair is November 2026.** That's the hard ship
date for whatever is live — scope ruthlessly toward it before adding anything
from later roadmap phases.

## What's in this repo

- `web/` — the actual platform (Next.js). This is where you'll spend nearly
  all your time.
- `esenet-2027-pitch.html` — the pitch deck, in ESENet's real brand colors/
  fonts/logo. Useful as the reference for brand tokens (see below).
- `esenet-logo.png` — the official wordmark, transparent background, cropped
  to content (4440×851). Its "ESE" and "Talent Fair" glyphs are near-white,
  so it only reads on a dark ground — never place it directly on a light
  page. Canonical copy for the web app lives at `web/public/logo.png`
  (same file); rendered via `web/src/components/logo.tsx`. Don't regenerate
  or redraw this logo — this PNG is the real asset, provided directly.
- `Dossier Sponsoring.pdf`, `Note Conceptuelle.pdf`, `Affiche Programme et
  Panels ESENet 2025.pdf`, `affiche.png` — source brand/vision material.

## Brand tokens (already wired into `web/src/app/globals.css`)

Dark-first, matching the real ESENet poster gradient (navy → violet →
magenta). Use the Tailwind utilities below rather than hardcoding hex:

| Token | Dark (default) | Light | Use for |
|---|---|---|---|
| `bg-bg` / `text-text` | `#0B0E36` / `#F5F3FC` | `#F5F4FC` / `#17143C` | page background / body text |
| `bg-surface` | `#161350` | `#FFFFFF` | cards |
| `text-accent` | `#7B53FD` (violet) | `#6A3EE0` | primary CTAs, the logo's "N" |
| `text-accent-2` | `#1AA6FC` (cyan) | `#08699E` | eyebrows, links, the logo's "et" |
| `text-magenta` | `#C13584` | `#A02870` | rare — sparing tertiary accent only |

Fonts: `font-display` = Poppins (headings), `font-sans` = Manrope (body,
default), `font-mono` = IBM Plex Mono (labels/data/tags). All loaded via
`next/font/google` in `web/src/app/layout.tsx`.

## Stack

Next.js (App Router, TypeScript) + Tailwind v4 + Supabase (Postgres, auth,
storage), deployed on Vercel. Chosen specifically to minimize boilerplate on
a 12-week clock — most CRUD/auth plumbing is generated, not hand-rolled.

**Windows note:** the native `@next/swc-win32-x64-msvc` binary is blocked by
this machine's application-control policy. `next dev`/`next build` fall back
to WASM bindings automatically, but Turbopack requires native bindings, so
`package.json` scripts pass `--webpack` explicitly. Don't remove that flag
without checking Turbopack works on the target machine first.

**`web/AGENTS.md` / `web/CLAUDE.md` are managed by Next.js, not by this
project.** Next 16 bundles its docs at `web/node_modules/next/dist/docs/`;
on `next dev` startup, `dist/server/lib/generate-agent-files.js` inserts/
refreshes a `<!-- BEGIN:nextjs-agent-rules -->…<!-- END -->` block in those
files when an AI agent is detected. This is described as a standard Next.js
feature (called from `start-server.js` → `app-info-log.js`) — verify against
the actual files in `node_modules` and `git log` on this machine before
relying on it, rather than taking this note on faith. In practice the block
says to consult the local docs for App Router work and to commit the
regenerated block to keep the git tree clean.

## Commands

All commands run from `web/`:

```bash
npm run dev      # dev server on :3000 (webpack, not turbopack — see Windows note)
npm run build    # production build — part of the pre-merge check
npm run lint     # eslint (flat config, eslint-config-next)
```

There is **no test runner** — `package.json` has no `test` script and no
test files exist. Verification is `npm run lint` + `npm run build` plus the
manual regression flow in `web/docs/QA.md`, run against the real dev Supabase
project (there are 4 permanent QA accounts; the password is not in the repo).
Treat that checklist as the substitute for an automated suite when a change
touches auth / companies / opportunities / applications / feed / RLS.

## Getting the app running

```bash
cd web
npm install          # already done once during scaffolding
cp .env.local.example .env.local
```

Then:
1. Create a project at [supabase.com](https://supabase.com) (free tier is enough for now).
2. Project Settings → API → copy the Project URL and `anon public` key into `.env.local`.
3. SQL Editor → run `web/supabase/schema.sql`, then every file in
   `web/supabase/migrations/` **in filename order** (`0002_...` through the
   highest-numbered file) — each one is additive on top of the last, not a
   replacement for `schema.sql`.
4. `npm run dev` → http://localhost:3000

Without a configured Supabase project, the app still runs — pages that need
data show a "connect Supabase" message instead of crashing (see
`isSupabaseConfigured()` in `web/src/lib/supabase/is-configured.ts`).

## Data model

`web/supabase/schema.sql` has the Phase 1 core; `web/supabase/migrations/`
layers everything after it — read both, the migrations are not optional
extras. As of this writing:

- `profiles` — one row per authenticated user (`role`: student/company/admin)
- `student_details` — 1:1 with a student profile (skills, bio, availability, CV), plus `education`/`experiences`/`projects`/`certifications` child tables. All public-read ("for company search") — surfaced at `/students` (signed-in-only directory + filters) and `/students/[id]` (read-only public profile; CV deliberately excluded, it stays in its applicant-scoped private bucket)
- `companies` — 1:1 with a company profile (name, website, verified flag, logo/banner). Public directory at `/companies` (verified companies + open-role counts, name search) and public page at `/companies/[id]` (logo/banner/description, published opportunities, team) — the company-side mirror of `/students` + `/students/[id]`
- `company_members` / `company_invites` — multi-user company accounts: an owner plus invited team members (each with their own login and an optional `title` shown in the feed), invite-by-email with accept-your-own-invite RLS
- `opportunities` — posted by a company (`type`: internship/pfe/job/alternance/freelance; `status`: pending/published/closed). Any company actor can edit (`/company/opportunities/[id]/edit`) or close/reopen it from the dashboard; a `closed` row leaves the marketplace but a student who already applied keeps read access via `has_application_to()` (`0017`). `0022` adds an optional `application_deadline date` — the row stays visible past it but the apply form is replaced with a closed notice and `applyToOpportunity` rejects late submissions server-side (no RLS involved).
- `applications` (+ `application_status_events`) — a student applying to an opportunity, with a status history log. The company applicants view shows headline/skills inline + a signed CV link + a collapsible status history; `0018` widened CV read from owner-only to `is_company_actor`. `0021` adds an optional `note` on each status event — a message the company attaches when changing status, surfaced on the student's `/applications/[id]` timeline and in the status-change notification. Students get a per-application detail page at `/applications/[id]` (opportunity/company links, the seeded "Applied" + logged-events timeline, cover message, withdraw-while-open)
- `saved_opportunities` — a student's bookmarks
- `posts` / `post_comments` / `post_likes` / `content_reports` — the LinkedIn-style feed: students and company people (owner or team member) publish posts (optionally as themselves or as the company), one level of comments, simple likes, and a reporting/admin-moderation queue with soft-delete + audit trail. Authors can edit their own post's text/link in place (`editPost`, `PostBody` client component); attribution columns stay frozen by the `protect_post_admin_fields` trigger, which also stamps `updated_at` (→ "edited" marker). Comment authors can likewise edit their own comment (`editComment`, `CommentRow`); `0023` adds `post_comments.edited_at` (set by the action, not a trigger — the comment table has no `updated_at`)
- `notifications` — per-user in-app feed (header bell dropdown — `NotificationBell`, showing the 5 most recent + auto-mark-read on open — plus the full `/notifications` page). Written best-effort from the server actions that already do the underlying mutation (`notify()` in `src/lib/notifications.ts`), never a trigger; recipient-only read/update. No email/push yet.

RLS policies are already in every migration: public read for
directory/browse/feed use cases, owner-only write, company-scoped access via
the shared `is_company_actor()` predicate, and admin-only moderation via
`is_admin()`. `0016` adds admin-only SELECT over `opportunities` /
`applications` (they were otherwise invisible to admins) — feeds the
`/admin` overview. See `web/docs/QA.md` for the full regression checklist and a
running log of real RLS bugs found and fixed — read it before touching any
policy in this schema, several of its gotchas are non-obvious and have bitten
this project more than once.

## Architecture & conventions

App Router under `web/src/app`, path alias `@/*` → `web/src/*`.

- **Mutations are Next.js server actions**, grouped by domain in
  `src/app/actions/*.ts` (`"use server"`), consumed from client components
  via `useActionState`. Every action follows the same shape, and it is
  load-bearing (see `actions/opportunities.ts` for the canonical example):
  1. `supabase.auth.getUser()` — never trust a client-supplied identity;
  2. re-check the caller's `role` (and company membership) server-side;
  3. validate input, returning `{ error, fieldErrors }` — never leak a raw
     Postgres error to the client (`console.error` server-side instead);
  4. write, then `revalidatePath(...)` and `redirect(...)`.
- **RLS is the real security boundary**, not the server-side checks above —
  those are duplicated defense. Every table has policies (public read for
  browse/directory/feed, owner-only write). Column-level "owner can edit
  everything but this one field" rules (`profiles.role`, `companies.verified`,
  `company_members.role`) are enforced by **DB triggers**, because RLS can
  only gate which rows a policy touches, not which columns. Read
  `web/docs/QA.md` before editing any policy — it logs several non-obvious
  RLS bugs this project already hit (recursive policy needing
  `SECURITY DEFINER`, `WITH CHECK` OR-ing across policies, RLS-blocked writes
  returning 200/0-rows rather than an error).
- **"Which company does this user act for"** is always resolved through
  `resolveCompanyId()` (`src/lib/company.ts`) / the `is_company_actor()` SQL
  predicate — never `company_id === auth.uid()`. A company is one permanent
  identity (`companies.profile_id`) plus 0+ `company_members`.
- **Page-level auth guards** live in `src/lib/auth/require-*.ts`
  (`requireStudentUser` / `requireCompanyUser` / `requireAdminUser`). They
  `redirect()` (to `/login?next=…` or away), never just hide UI, and return
  `{ supabase, user, ... }` for the page to reuse.
- **Supabase clients:** `src/lib/supabase/server.ts` (server components /
  actions, cookie-aware), `client.ts` (browser). `middleware.ts` +
  `lib/supabase/middleware.ts` refresh the session cookie on every request.
- **Signup provisioning is deferred to first login.** Email confirmation is
  on, so `signUp()` has no session to satisfy the `profiles` insert policy;
  `signIn()` creates the `profiles` / `student_details` row from auth-user
  metadata on first successful login. Don't "fix" this by disabling email
  confirmation. A company-role signup with no pending invite is left
  unattached and routed to `/company/onboarding` (create vs. request-to-join).
- **Password reset** is `/forgot-password` → `resetPasswordForEmail` (redirect
  to `/auth/callback?next=/reset-password`) → `route.ts` does the PKCE
  `exchangeCodeForSession` → `/reset-password` form calls `updateUser`.
  `/auth/callback` is the only route handler and the general email-link
  landing point. **Supabase dashboard must allowlist `<origin>/auth/callback`**
  (prod + localhost) under Authentication → URL Configuration.
- **`isSupabaseConfigured()`** gates the whole app — with no env vars,
  middleware no-ops and data pages render a "connect Supabase" state instead
  of crashing.
- **DB types are hand-written** in `src/types/database.ts` (not generated
  from the linked project). Keep them in sync with `schema.sql` +
  migrations manually.
- **Styling:** Tailwind v4, dark-first. Compose `src/components/ui/*`
  (`Button`, `Field`, `Card`, `Badge`, `EmptyState`) rather than
  re-inlining class stacks; never use a raw hex. Full rules in
  `web/docs/DESIGN_SYSTEM.md`.
- **Schema changes are additive migration files only** —
  `web/supabase/migrations/NNNN_*.sql`, next number in sequence. Never edit
  `schema.sql` or an existing migration retroactively.

## Roadmap scope (do NOT build ahead of this without asking)

**Phase 1 — ship for Nov 2026:** student profile, company posting
(internship/PFE/job), browse + filter, apply flow, admin approval of
companies/postings, student directory (`/students`). **Done and
live-tested** — see `web/docs/QA.md`. Deployed on Vercel
(`esenet-platforme.vercel.app`); pushes to `main` auto-deploy to prod.

**Explicitly deferred past the event:** alumni network/messaging, a real
scored matching engine (the pre-launch tag-overlap filter is built —
`fetchRecommendedOpportunities` in `src/lib/opportunities.ts`, surfaced as
"Recommended for you" on `/opportunities` for students with skills),
QR check-in/event-day companion, freelance/hackathon/challenge modules.

Current status: Phase 1 is built (student profile with education/experience/
projects/certifications, company posting + admin approval, browse/filter,
apply flow) plus a Phase 2 layer on top — multi-user company accounts and a
LinkedIn-style community feed (posts, comments, likes, reporting, admin
moderation) shared by students and companies. All of it has been live-tested
against a real Supabase project, not just code-reviewed; bugs found that way
are logged in `web/docs/QA.md` alongside the regression checklist. No seed/
demo content is checked in — QA fixtures live only in the dev Supabase
project (see `web/docs/QA.md`), and the feed/opportunity lists are meant to
start empty in a fresh environment.
