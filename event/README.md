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
| Speakers | `SPEAKERS` in `src/content/event.ts` — empty means "to be announced" cards |
| Photos (all real ESENet 2025 footage) | `src/assets/media/` |
| Logos | `src/assets/brand/` |
| Hero video loop (15 s, 2 MB) | `public/media/hero.mp4` |
| Brand tokens | `src/app/globals.css` (from `video editing/Data Alchimie poster design/brand-kit/BRAND.md`) |

Routes: `/en`, `/fr`, `/en/register`, `/fr/register`. `/` redirects to the
browser's language (French if it is listed before English, else English) via
`src/proxy.ts`.

## Design rules

- Real photographs and footage only, captioned. No stock, no generated imagery.
- The signature gradient appears only on hairlines and the odd highlighted word.
- Numbered mono labels (`01 — The edition`) structure the page instead of icons.
- The ESENet logo has light letters: dark backgrounds only.
- No emoji, no yellow.

## Not built yet

- The pass registration form (`/register` currently says registration opens soon).
- Deployment (planned as its own Vercel project with Root Directory `event`).
