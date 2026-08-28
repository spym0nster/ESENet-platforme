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
- `student_details` — 1:1 with a student profile (skills, bio, availability, CV), plus `education`/`experiences`/`projects`/`certifications` child tables
- `companies` — 1:1 with a company profile (name, website, verified flag, logo/banner)
- `company_members` / `company_invites` — multi-user company accounts: an owner plus invited team members (each with their own login and an optional `title` shown in the feed), invite-by-email with accept-your-own-invite RLS
- `opportunities` — posted by a company (`type`: internship/pfe/job/alternance/freelance; `status`: pending/published/closed)
- `applications` (+ `application_status_events`) — a student applying to an opportunity, with a status history log
- `saved_opportunities` — a student's bookmarks
- `posts` / `post_comments` / `post_likes` / `content_reports` — the LinkedIn-style feed: students and company people (owner or team member) publish posts (optionally as themselves or as the company), one level of comments, simple likes, and a reporting/admin-moderation queue with soft-delete + audit trail

RLS policies are already in every migration: public read for
directory/browse/feed use cases, owner-only write, company-scoped access via
the shared `is_company_actor()` predicate, and admin-only moderation via
`is_admin()`. See `web/docs/QA.md` for the full regression checklist and a
running log of real RLS bugs found and fixed — read it before touching any
policy in this schema, several of its gotchas are non-obvious and have bitten
this project more than once.

## Roadmap scope (do NOT build ahead of this without asking)

**Phase 1 — ship for Nov 2026:** student profile, company posting
(internship/PFE/job), browse + filter, apply flow, admin approval of
companies/postings. **Done and live-tested** — see `web/docs/QA.md`.

**Explicitly deferred past the event:** alumni network/messaging, a real
scored matching engine (a simple tag-overlap filter is fine pre-launch),
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
