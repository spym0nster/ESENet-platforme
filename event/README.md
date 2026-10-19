# ESENet 2026 — Data Alchimie event site

The public website for the 8th ESENet Talent Fair (25 November 2026, ESEN
Technopôle, Manouba). Separate from the year-round platform in `../web`:
different brand (Data Alchimie navy + blue → cyan → green), no database,
fully static.

## Run it

```bash
cd event
npm install
npm run dev      # http://localhost:3100 (webpack — see the Windows note in ../CLAUDE.md)
npm run lint
npm run build
```

## Where things live

| What | File |
|---|---|
| All visitor-facing text, English | `src/content/dictionaries/en.ts` |
| All visitor-facing text, French | `src/content/dictionaries/fr.ts` (typed against `en.ts`, so a missing key fails the build) |
| Date, times, numbers, links, programme, partnership benefits | `src/content/event.ts` |
| 2026 speakers | `SPEAKERS` in `src/content/event.ts` — they lead the "ESENet Voices" row as they're added |
| 2025 exhibitors and speakers (from esenet-tn.com) | `src/content/past.ts`, logos in `src/assets/exhibitors/`, portraits in `src/assets/speakers-2025/` |
| Photos (real ESENet footage, the team Drive, esenet-tn.com) | `src/assets/media/` |
| Poster motifs (title lockup, flask, node icons, data lines) | `src/components/alchemy.tsx` |
| Logos | `src/assets/brand/` |
| Hero video loop (15 s, 2 MB) | `public/media/hero.mp4` |
| Brand tokens | `src/app/globals.css` (from `video editing/Data Alchimie poster design/brand-kit/BRAND.md`) |

Routes: `/en`, `/fr`, `/{lang}/register` (visitor pass), `/{lang}/ticket/[code]` (QR ticket), `/{lang}/exhibit` (free stand application), `/{lang}/exhibit/thanks`. `/` redirects to the
browser's language (French if it is listed before English, else English) via
`src/proxy.ts`.

## Design rules

- Light page in the Data Alchimie colours. Dark navy is kept for feature
  bands only: the video hero, the flask programme, the Platinum card, the
  closing call and the footer (the ESENet logo and the title lockup only read
  on dark).
- On white, use the deep accents (`text-blue`, `text-teal`,
  `text-green-deep`); the bright poster colours are for dark bands.
- The poster's motifs carry the theme: the data-lined "D" and test-tube "i",
  Data → Intelligence → Value, the flask the data pours into, node icons.
  Every animation stops for `prefers-reduced-motion`.
- Real photographs and footage only, captioned. No stock, no generated imagery.
- The signature gradient appears only on hairlines and the odd highlighted word.
- Numbered mono labels (`01 — The edition`) structure the page instead of icons.
- The ESENet logo has light letters: dark backgrounds only.
- No emoji, no yellow.

## Registration

Visitor passes and free exhibitor stands (2 people each, optional sponsor-pack
interest) are written by server actions in `src/app/actions/register.ts` to the
platform's Supabase project, with the service role key (tables have RLS and no
policies). Data lives in its own Supabase project `esenet-event-2026` (ref pxfuixfiudbhahgarekt, eu-west-3), separate from the platform; migration `web/supabase/migrations/0025_event_registrations.sql` is applied there. Setup:
copy `.env.local.example` to `.env.local` and fill it. Without the env vars the
forms show "temporarily unavailable". Copy lives in `src/content/forms.ts`.
Spam: honeypot only for now (Turnstile is a later step). Stands are free;
sponsor packs only add extras (`BENEFITS` in `event.ts`).

## Organisers

`/{lang}/admin` (password = `ADMIN_PASSWORD`): counts, approve/reject stand
applications with a stand number (approval emails the team badges at
`/{lang}/badge/[code]`), visitor list. `/{lang}/admin/scan`: camera QR check-in
(visitor `ESN-` and staff `STF-` codes; manual entry as fallback).

Live: https://esenet-talent-fair.vercel.app (Vercel project `esenet-talent-fair`,
deployed with `vercel deploy --prod` from `event/`).

Admin also has: visitor CV download (signed link, only with CV consent), CSV
export (`/{lang}/admin/export/visitors.csv`, `exhibitors.csv`), and
`/{lang}/admin/mail` (personalised bulk email, with a test-address mode).
Emails (`src/lib/emails.ts`): visitor ticket + QR + poster + programme, stand
"awaiting approval", stand approved + team badges. Sender
`EVENT_EMAIL_FROM` = esenet.talentfair@esen.tn; **the sending domain must be
verified in Resend** (esen.tn needs SPF/DKIM DNS records) or sends return 403.
QR images for emails come from `/qr/[code].png`.

## Not built yet

- Turnstile anti-spam, custom domain (esenet-tn.com), the Google Sheet webhook and Resend keys.
