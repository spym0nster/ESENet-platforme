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
  fonts/logo. Useful as the reference for brand tokens (see below) — don't
  regenerate the logo from scratch, `web/src/components/logo.tsx` already has
  the vector version used there.
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
3. SQL Editor → paste and run `web/supabase/schema.sql` (creates all tables + row-level security policies).
4. `npm run dev` → http://localhost:3000

Without a configured Supabase project, the app still runs — pages that need
data show a "connect Supabase" message instead of crashing (see
`isSupabaseConfigured()` in `web/src/lib/supabase/is-configured.ts`).

## Data model (Phase 1 — see `web/supabase/schema.sql`)

- `profiles` — one row per authenticated user (`role`: student/company/admin)
- `student_details` — 1:1 with a student profile (skills, bio, availability, CV)
- `companies` — 1:1 with a company profile (name, website, verified flag)
- `opportunities` — posted by a company (`type`: internship/pfe/job/alternance/freelance; `status`: pending/published/closed)
- `applications` — a student applying to an opportunity

RLS policies are already in the schema: public read for directory/browse use
cases, owner-only write, and companies can read applications to their own
postings.

## Roadmap scope (do NOT build ahead of this without asking)

**Phase 1 — ship for Nov 2026 (this is what's scaffolded so far):**
student profile, company posting (internship/PFE/job), browse + filter,
apply flow, admin approval of companies/postings.

**Explicitly deferred past the event:** alumni network/messaging, a real
scored matching engine (a simple tag-overlap filter is fine pre-launch),
QR check-in/event-day companion, freelance/hackathon/challenge modules.

Current status: scaffold only (landing page, auth, opportunity browse/apply
flow, empty database). Still missing: company posting UI, admin approval
queue, student profile edit UI, seed content.
