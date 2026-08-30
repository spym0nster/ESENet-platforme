# ESENet — UX/UI elevation spec

Companion to `DESIGN_SYSTEM.md`. This is the *direction*, not a rewrite: no new
colours, no new fonts, no new libraries. Everything here is composed from the
tokens already in `globals.css`.

Benchmark: Handshake (card composition, information density), Welcome to the
Jungle / JobTeaser (opportunity detail, company pages). Reference their
*hierarchy*, never their layout, copy or assets.

---

## 1. The thesis

The platform currently reads as "a correct CRUD app in ESENet colours". Three
things separate that from a product students want to open:

1. **Weight is information.** Right now most text on a card is the same size and
   the same opacity, so the eye has nowhere to land. The role title should be the
   loudest thing on an opportunity card by a wide margin; company, tags and meta
   step down in size *and* opacity.
2. **Depth on a dark ground comes from light, not shadow.** A drop shadow does
   almost nothing on `#0B0E36`. What reads as depth: `--surface` on `--bg`, a
   1px hairline border, and an inset top highlight.
3. **One signature, everything else quiet.** Spend the boldness in a single
   place and keep the rest disciplined.

## 2. Signature element — the skill-overlap arc

A 46px ring stroked with the poster gradient (cyan → violet → magenta), filled
to how many of the skills **this opportunity asks for** the student already has.
Centre label is `3/7` in mono.

The denominator is the opportunity's required-skill count, never the student's.
A student with two skills matching a two-skill profile must not render a full
ring — that would reward a thin profile and make the signature dishonest.

Why this and not a "% match" badge: it renders a number the platform can defend
from data it already computes, and it is the only place the full brand gradient
appears in the product UI, which is what makes it the memorable element.

**Where it renders:**
- The "Recommended for you" strip and `/opportunities/[id]` — both already have
  the overlap data in scope. Always.
- Browse list cards **only if** the list query already selects each row's skills
  and the viewer's skills are already in page scope. Check; don't assume. If
  computing it would mean touching the query, leave browse cards arc-free and
  raise it as a separate data ticket.

**Empty and edge cases:**
- Signed out, or a profile with fewer than three skills → **no arc at all**,
  not an empty ring. Show a link to complete the profile instead.
- Matched skill chips get the cyan treatment; unmatched stay neutral. Same
  information, twice, cheaply.
- One shared `<linearGradient id="esenetArc">` in a hidden SVG in the layout —
  don't redefine it per card.

## 3. Derived values

**Retune the tokens that already exist; do not add parallel names.** The app
already has `--text-muted`, `--text-faint` and `--border` wired into Tailwind
utilities across the codebase. Two vocabularies for one idea is worse than a
slightly off value. No raw hex in components, ever.

| Token | Today | Becomes | Use |
|---|---|---|---|
| `--border` | `.13` | `rgba(245,243,252,.09)` | card and divider hairlines |
| `--border-strong` | — | `rgba(245,243,252,.16)` | inputs, secondary button border |
| `--text-muted` | `#b3add9` | unchanged | secondary text |
| `--text-faint` | `#7a74a8` | `#8a84b8` | meta, mono labels, placeholders |
| `--lift` | — | `inset 0 1px 0 rgba(255,255,255,.06)` | every card — this is the depth trick |
| `--glow` | — | `0 10px 30px -12px rgba(123,83,253,.55)` | hover only |

`--text-faint` moves because `#7a74a8` on `--surface` lands near 3.9:1 —
under AA for the 11px mono meta it styles. `#8a84b8` clears 4.5:1 with the same
character. Softening `--border` to `.09` is only safe alongside `--lift`; the
inset highlight is what keeps cards from dissolving. Inputs and secondary
buttons take `--border-strong`, not `--border` — a form field needs a visible
edge, a divider does not.

Radius: `16px` cards, `10px` controls, `6px` chips, `999px` avatars.
Spacing: `4 / 8 / 12 / 16 / 24 / 32 / 48` only. No `13px`, no `18px`.

Type scale (roles, not sizes-in-components):

| Role | Face | Size / weight |
|---|---|---|
| Page title (`h1`) | Poppins | `text-3xl font-extrabold` (30 / 800) |
| Section heading (`h2` inside a page) | Poppins | `text-lg font-semibold` (18 / 600) |
| Card title | Poppins | 18 / 600 |
| Body | Manrope | 15 / 400 |
| Secondary | Manrope | 13.5 / 400, `--muted` |
| Data label / eyebrow | IBM Plex Mono | `text-xs`, uppercase, `tracking-widest`, `--text-muted` |

> The page title was spec'd at 29 / 600 in the first draft. That was a
> mis-diagnosis: nothing read as loud *by contrast* because every heading in
> the app was 800, and the fix was to quiet the things around the h1 (which
> happened — section labels dropped to the mono eyebrow, card meta stepped
> down in weight and opacity), not to shrink the h1. The whole app settled on
> `text-3xl font-extrabold` for page titles; this row now matches it.

Mono is reserved for things that are *data*: opportunity type, dates, counts,
skill tags, and the eyebrow/data label above a title. Never for prose, and not
for a real section heading — that's Poppins `text-lg font-semibold`.

## 4. Component contracts

**Card** — `--surface`, 1px `--border`, `--lift`, radius 16. Interactive
variant adds on hover: `translateY(-3px)` and `--glow`. Nothing else — no
border-colour jump (the glow already says it, and `.09` → `.45` flickers) and
**no gradient hairline** (§8 caps the gradient at three places; a hover
hairline on every card would be a fourth, and it's desktop-only decoration
besides). The reference HTML shows a hairline; the HTML is superseded here.
Static cards get none of this — hover lift means "this whole thing is a link".

**Button** — three levels, visually distinct at a glance: `primary` (solid
violet, soft violet shadow), `secondary` (transparent, `--border-strong`
border, violet border + 10% violet wash on hover), `ghost` (text only).

Every button gets **both** a hover state and `:active { translateY(1px) }`.
Hover confirms "this is interactive" before you commit; `:active` only fires
after. Primary's hover is a lift in shadow or a 4–6% lighten — restrained, but
never nothing. Two sizes: default 44px, and `compact` at 36px for buttons that
sit inside a dense row (an applicant's status control, a dashboard row action).
36px with real spacing around it clears the WCAG target-size minimum; a 44px
button in a table row makes the row look inflated.

Labels are verbs and stay identical through the flow: the button says *Apply*,
the toast says *Application sent*, the timeline says *Application sent*.

**Badge** — one colour per opportunity type, mapped to the existing accents:
PFE → violet, Stage/Alternance → cyan, Emploi → magenta, Freelance → neutral.
*Posting* status (pending / published / closed) uses one hue at three opacities
— three low-stakes values a company glances at. *Application* status keeps its
semantic colours (accepted → violet, interview → cyan, not selected → magenta,
neutral for the rest): a student scanning their list is doing fast triage, and
colour is the thing doing that work. No new hues either way.

**Logo fallback** — no company logo means initials on a
`linear-gradient(140deg, #2A1E6E, --accent 55%, --magenta)` tile with an inset
white top highlight. Never a grey square, never a broken image.

**EmptyState** — icon in a tinted violet rounded square, a title that names the
situation, one line that says what to do next *with a real number in it*
("27 offres sont ouvertes en ce moment"), one primary CTA. No apologies, no
"No results found".

**Skeleton** — replace every spinner on list and detail routes. Shape the
skeleton like the thing that's loading (logo tile, title bar, chip row), don't
use generic grey rectangles.

## 5. Page-level, in order of impact

1. **`/opportunities` browse + `/opportunities/[id]`** — the card above; detail
   hero with logo, title, verified badge, arc, then a 4-up facts row
   (Type · Lieu · Candidatures · Clôture) instead of a paragraph. **No sticky
   apply bar** — it fights mobile browser chrome and can't hold the cover
   message. Instead: hoist the apply button directly under the facts row, and
   put the optional cover message behind an "Add a note" disclosure so the CTA
   clears the fold on its own. A past deadline shows a closed notice where the
   form was. Browse: collapse filters to type, skills and deadline, with the
   rest behind "More filters" — six stacked inputs before the first card is the
   worst friction in the product.
2. **Feed** — one identity line (avatar, name, role, company, time), body at 88%
   opacity, linked opportunity as a bordered preview block, engagement bar as a
   quiet footer above a hairline. Comments indented once, never twice.
3. **`/companies/[id]`** — gradient banner, logo overlapping it by ~26px, tabs
   (À propos / Offres·n / Équipe / Publications) with a gradient underline on the
   active tab.
4. **`/students/[id]`** — same header pattern as company; skills as mono chips;
   education/experience/projects as a hairline-separated list, not nested cards.
5. **Dashboards** — one stat row, then the actual work list. Don't build a
   dashboard of cards-in-cards. On the company dashboard, give each row one
   obvious primary path (view applicants) and demote the rest.
6. **`/` landing** — because it's the page a student sees least and the
   one a *company* sees first. It holds the most raw hex in the app and the
   only gradient-clipped heading text. Rebuild it from tokens, cut the heading
   gradient, and move real opportunities above the feature cards: proof beats
   promise.
7. **Sweep the rest** — `/saved`, `/applications`, `/applications/[id]`,
   `/notifications`, `/profile`, `/company/profile`, `/company/team`,
   `/company/opportunities/new` + `/edit`, `/admin/*`, and the auth pages.
   Not a redesign: swap in the primitives, drop the emoji icons, fix the
   `h1` that's a different size on the auth pages, apply `compact` buttons
   where rows went chunky, and give every route a `loading.tsx`. Without this
   the app ends up elevated on six routes and untouched on twenty.

## 6. Quality floor (not negotiable, not announced)

- Every interactive element has a visible `:focus-visible` ring in `--accent-2`.
- `@media (prefers-reduced-motion: reduce)` kills all transitions and the
  skeleton shimmer.
- Tested at 375px and 390px, not just "responsive".
- Contrast: `--faint` on `--surface` is the floor — never go lighter for text.
- Presentation layer only. No data-fetching or server-action changes.

## 7. Simple and friendly (the second half of "pro")

Polish without ease is just a nicer-looking maze. Every rule below is about
lowering the effort it takes a 21-year-old to do the thing they came for.

- **One primary action per screen** on task screens — browse, detail, apply,
  single-purpose forms. Exactly one solid violet button in the viewport. On
  multi-task management screens (`/profile`, `/company/profile`,
  `/company/team`) the rule is one primary **per section**: a settings form
  whose only submit is a faint outline button reads as disabled.
- **Every page answers "what do I do now?"** including the empty ones. A student
  landing on an empty dashboard should see a next step, not a summary of nothing.
- **Progressive disclosure.** Show the three filters students actually use
  (type, skills, deadline) and collapse the rest behind *Plus de filtres*. Long
  profile forms are hairline-separated sections, not one 40-field wall.
- **Numbers build trust.** Counts on tabs, on filters, in empty states, on the
  applicants view. `Offres · 4` beats `Offres`.
- **No data-model vocabulary in the UI.** A student sees `PFE · ouverte`, never
  `type: pfe, status: published`. `resolveCompanyId`, `is_company_actor`,
  `opportunity` as a noun — none of that reaches the screen.
- **Nothing important lives in a hover.** Phones have no hover. Save, edit and
  overflow controls are always visible, minimum 44×44px touch target.
- **Loading is regional, never global.** A slow applicants list must not blank
  the header and nav around it.
- **Errors are inline and specific.** Field errors sit under the field in
  magenta and say what to fix. Toasts are for things that succeeded.

**Voice:** French, *tutoiement*, sentence case, plain verbs. No exclamation
marks, no emoji in product chrome, no corporate filler. `Postuler`, not
`Soumettre ma candidature`. `Tu n'as pas encore de candidature` beats
`Aucune candidature trouvée`. Action names never change mid-flow: the button
says *Postuler* → the toast says *Candidature envoyée* → the timeline says
*Candidature envoyée*.

## 8. What "pro" is not

These read as *AI-designed* rather than designed, and are out of scope no matter
how good they look in isolation: frosted-glass/blurred cards, glow on anything
that isn't hovered, gradient-filled heading text, emoji standing in for icons,
3D tilt or parallax, confetti, animated gradients, icon-only navigation, cards
nested inside cards, more than two font weights in one screen, more than one
accent colour on a single card, and **any full-viewport ambient gradient wash
behind the app**. (The reference HTML has one; that file is a showcase page, not
the product. A permanent violet haze behind `/admin` is exactly the AI-designed
look this section exists to prevent. The marketing landing page may keep a
gradient; nothing behind a signed-in screen may.) The gradient appears in exactly three places in
the whole product: the match arc, the company banner, and the active-tab
underline. Anywhere else, it's a mistake.

---

## Appendix — prompt for Claude Code

Paste as-is. It is deliberately long: every constraint in it exists because its
absence produces a predictable failure.

```
You are the design engineer on ESENet. The product works; it does not yet look
or feel like something a student would choose to open. Your job over the next
few commits is to close that gap — polished and confident, and at the same time
simpler and friendlier to use than it is today. Both halves matter: a beautiful
screen that makes someone hesitate has failed.

READ FIRST, IN THIS ORDER
1. web/docs/UX_ELEVATION.md — the direction. §2 signature, §3 tokens,
   §4 component contracts, §5 page order, §6 quality floor, §7 simplicity and
   voice, §8 the anti-pattern list.
2. web/docs/DESIGN_SYSTEM.md — the existing rules. Where the two disagree, say
   so and stop; do not silently pick one.
3. CLAUDE.md — conventions and roadmap scope.
Then read the actual code before forming any opinion: src/components/ui/*,
src/app/globals.css, and every page.tsx under src/app. Do not audit from memory
of what a Next.js app usually looks like.

NON-NEGOTIABLE CONSTRAINTS
- No new colours, no new fonts, no new dependencies. Everything derives from the
  tokens in globals.css. If you write a raw hex in a component, you are wrong.
- Presentation layer only. Do not touch server actions, Supabase queries, RLS,
  migrations, or src/types. If a design need appears to require a data change,
  stop and tell me instead of making it.
- No new routes and nothing from the deferred roadmap in CLAUDE.md.
- Local commits only, never deploy. `npm run lint` and `npm run build` clean at
  every single commit — not just at the end.
- Small commits. If a diff crosses more than ~6 files, split it.
- Ask before deleting a component or changing anything's props signature.

WHAT "GOOD" MEANS HERE, CONCRETELY
Hierarchy: on any card I should be able to name the single loudest element in
under a second. Weight and opacity step down together; two things never compete.
Depth: on #0B0E36 shadows do nothing — depth is --surface over --bg, a 1px
hairline, and the inset top highlight. Motion: transitions are 120-180ms ease,
they exist to confirm an interaction, never to entertain. Restraint: the brand
gradient appears in exactly three places (match arc, company banner, active-tab
underline) and nowhere else. Friendliness: one primary action per screen, an
obvious next step on every page including the empty ones, counts on tabs and
filters, no data-model words in the UI, nothing important behind a hover.
Before you commit anything, reread §8 and delete whatever it names.

═══ PHASE 1 — AUDIT. NO CODE CHANGES. ═══
Enumerate the real routes from the file tree first and list them, so I can see
you covered everything. Then walk each one at desktop and at 375px.

For each route, give me a short block:
  ROUTE — one line on what a user is trying to do here
  · Hierarchy — what competes, what should be loudest and isn't
  · Default-looking — components that read as unstyled or generic
  · Spacing — anything off the 4/8/12/16/24/32/48 scale, misalignments
  · States — missing or apologetic empty / loading / error states
  · Tokens — raw hex, off-token colours, ad-hoc font sizes
  · Friction — the one thing that most makes this page harder than it should be

Then close with:
  · The 10 highest-impact fixes across the whole app, ranked, each with the
    route and the reason it ranks there.
  · Any conflict you found between the spec and the code.
  · Anything in the spec you think is wrong for this codebase — I want the
    disagreement now, not after it is built.

Do not write code. Do not start Phase 2. Stop here and wait.

═══ PHASE 2 — TOKENS + PRIMITIVES ═══
Highest leverage, lowest risk: everything downstream inherits from these.

1. Add the §3 derived tokens to globals.css (--line, --line-strong, --muted,
   --faint, --lift, --glow) plus the radius and spacing scale. Wire them as
   Tailwind v4 utilities the way the existing tokens are wired, so components
   never reach for a raw value.
2. Rebuild src/components/ui/* per §4: Card (with an explicit interactive
   variant — hover lift only where something is actually clickable), Button
   (primary / secondary / ghost, visually distinct at a glance, :active press
   state), Badge (opportunity type → accent mapping, status via opacity),
   EmptyState (icon, title, one line with a real number, one CTA), and a new
   Skeleton shaped like the content it replaces.
3. Add the shared <linearGradient id="esenetArc"> to the root layout once, and
   build MatchArc per §2 — including the empty case: no skills or signed out
   means no arc at all, plus a link to complete the profile.
4. Every primitive: visible :focus-visible ring in --accent-2, 44px minimum
   touch target, and correct behaviour under prefers-reduced-motion.

Then critique your own work before committing: open each primitive and ask what
a designer would cut. Remove one thing. Tell me what you removed and why.

Commit. Then, for each primitive, describe the before and the after in plain
language — what it looked like, what it looks like now, what a user notices.
Not a changelog of class names. If you can run the dev server and capture a
screenshot, do it; otherwise describe precisely enough that I can picture it.
Stop and wait for my review.

═══ PHASE 3 — PAGES ═══
One commit per numbered item in §5, in that order: opportunities browse +
detail, feed, company profile, student profile, dashboards.

For each item:
- Compose from the Phase 2 primitives. If you find yourself re-inlining a class
  stack, the primitive is missing something — fix the primitive instead.
- Apply §7 to the copy on that page as you go: French, tutoiement, sentence
  case, action names consistent through the flow.
- Verify at 375px before committing, not after.
- Then tell me: what visibly changed, what a student notices first, and anything
  you deliberately left alone.
Stop after each item and wait.

FINALLY
Do not fix things I did not ask about, do not refactor while you are in there,
and if you are unsure whether something counts as presentation or logic, ask.
```
