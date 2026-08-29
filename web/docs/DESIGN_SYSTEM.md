# ESENet design system

> **Superseded by `UX_ELEVATION.md` for visual language** (hierarchy, depth,
> the component contracts, the type scale, the derived tokens). Where this
> file and `UX_ELEVATION.md` disagree, `UX_ELEVATION.md` wins. This file is
> still current for: the token *names* and their Tailwind wiring, the "compose
> `ui/*`, don't hand-roll" rule, and the "no new hex / no new font" rule. A
> full reconcile of the two lands as the last commit of the elevation work.

This documents the design language that already existed implicitly across
the codebase (tokens in `src/app/globals.css`, patterns repeated across
forms/pages) and the shared component set extracted from it in this phase.
This was a documentation + extraction pass, not a redesign — no new
colors, fonts, or layout paradigm were introduced. Every future screen
should build from this file's components rather than hand-rolling Tailwind
classes again.

## Tokens (source of truth: `src/app/globals.css`)

Dark-first, light-aware via `prefers-color-scheme` / `data-theme`. Always
use the Tailwind utility, never a raw hex value.

| Utility | Dark (default) | Light | Use for |
|---|---|---|---|
| `bg-bg` / `text-text` | `#0B0E36` / `#F5F3FC` | `#F5F4FC` / `#17143C` | page background / body text |
| `bg-surface` | `#161350` | `#FFFFFF` | cards, inputs |
| `bg-surface-alt` | `#1E1A63` | `#ECE9F8` | secondary surfaces (code chips, muted badges) |
| `border-border` | `rgba(245,243,252,.13)` | `#DDD7F0` | all borders |
| `text-accent` / `bg-accent` | `#7B53FD` | `#6A3EE0` | primary actions, links (hover) |
| `text-accent-2` | `#1AA6FC` | `#08699E` | eyebrows, secondary links, focus rings |
| `bg-accent2-soft` / `text-accent-2` | pale cyan chip | pale cyan chip | info/type badges |
| `bg-accent-soft` / `text-accent-on-soft` | pale violet chip | pale violet chip | success/confirmation banners |
| `text-magenta` | `#C13584` | `#A02870` | errors, destructive actions — sparingly |
| `text-text-muted` / `text-text-faint` | `#B3ADD9` / `#7A74A8` | `#58527E` / `#8B85AD` | secondary / tertiary text, field labels |

Fonts: `font-display` (Poppins, headings only), `font-sans` (Manrope, body
default), `font-mono` (IBM Plex Mono — eyebrows, labels, tags, badges,
status pills — never body copy).

Spacing/radius: forms use `rounded-md`, cards use `rounded-lg`; vertical
rhythm is `space-y-4` inside a form, `space-y-10`/section `<fieldset>`s for
long multi-section forms (see `opportunity-form.tsx`).

## Shared components (`src/components/ui/`)

| Component | Replaces | Notes |
|---|---|---|
| `Button` | hand-rolled `<button>`/`<Link>` classes repeated in every form | variants: `primary` (bg-accent), `secondary` (bordered), `ghost`; `pending` prop shows a text swap, never a spinner icon (matches existing "Publishing…" pattern) |
| `Field` | the `Field` label+input wrapper duplicated verbatim in `login-form.tsx` and `signup-form.tsx` | label + input/textarea/select slot + inline error line |
| `Textarea`, `Select` | ad-hoc styling per form | same border/focus treatment as `Field`'s input |
| `Card` | `rounded-lg border border-border bg-surface p-*` repeated on every list item/dashboard tile | |
| `Badge` | the one hand-rolled `StatusBadge` in the company dashboard, and the type/location pills on opportunity cards | variants: `info` (accent-2 soft), `neutral` (surface-alt), `success`, `danger` |
| `EmptyState` | the one hand-rolled empty state in the company dashboard | title + body + optional CTA, reusable for every future "no X yet" screen (saved opportunities, applicants list, etc.) |

Existing forms are migrated opportunistically as each phase touches them —
this phase converts `login-form.tsx` and `signup-form.tsx` (the exact
duplication called out in the audit) and the dashboard's status pill /
empty state. Forms not touched this phase (`apply-form.tsx`,
`opportunity-form.tsx`) keep their current inline styling for now; migrate
them the next time either is modified, rather than as a separate sweep that
risks an unrelated regression.

## Rules for new screens

1. No new hex colors — extend the token table above first if a real gap
   appears, don't inline one.
2. No new font — three exist and cover heading/body/label needs.
3. Prefer composing `ui/*` components over new inline Tailwind stacks.
4. Status/state pills always use `Badge`, never a bespoke `<span>`.
5. Every list screen gets an explicit `EmptyState`, never a bare "nothing
   here" text node.
