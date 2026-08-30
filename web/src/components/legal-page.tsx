import type { ReactNode } from "react";

/**
 * Shared shell for /privacy, /terms, /cookies. These are structural drafts,
 * not finished legal text — see the Phase 3 audit (finding O: no legal
 * pages existed at all, despite the app already collecting names, emails,
 * CVs, education/experience history, and profile photos). Sections use
 * <Fact> for what the platform actually does today (verifiable in this
 * repo, safe to state plainly) and <NeedsReview> for anything that's
 * ESEN's or legal counsel's call to make, not this codebase's — retention
 * periods, jurisdiction, a real contact address, and so on. Never blur
 * the two together in the copy itself.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Legal
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{title}</h1>

      <div className="mt-6 rounded-card border border-dashed border-magenta/50 bg-magenta-soft p-4 text-sm">
        <p className="font-semibold text-text">
          Working draft — not yet reviewed or approved by ESEN.
        </p>
        <p className="mt-1 text-text-muted">
          Sections marked <ReviewTag /> describe something ESEN or legal
          counsel needs to decide, not something this platform has already
          settled. Everything else describes what ESENet actually does
          today, as built — not aspirational or invented policy.
        </p>
      </div>

      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-text-muted [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

function ReviewTag() {
  return (
    <span className="rounded bg-magenta-soft px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-magenta">
      Needs review
    </span>
  );
}

/** Wraps a paragraph that's ESEN's/legal's decision to make, not a fact about the app. */
export function NeedsReview({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-ctrl border border-dashed border-magenta/50 bg-surface-alt p-3">
      <ReviewTag /> <span className="ml-1">{children}</span>
    </p>
  );
}
