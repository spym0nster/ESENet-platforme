/**
 * A small mono data label on a soft tint. Four tones, all from existing
 * tokens:
 *
 *   neutral  — anything without a category
 *   cyan     — internship / alternance (a "stage")
 *   violet   — PFE; also application status "accepted"
 *   magenta  — a job ("emploi"); also "not selected" / withdrawn
 *
 * Opportunity type → tone and application status → tone are mapped by the
 * page (a small const next to its TYPE_LABEL), not here. Posting status
 * (pending / published / closed) is `tone="neutral"` at three opacities —
 * pass `className="opacity-70"` etc. from the dashboard; it's a low-stakes
 * glance, not a colour.
 */
const TONES = {
  neutral: "bg-surface-alt text-text-muted",
  cyan: "bg-accent2-soft text-accent-2",
  violet: "bg-accent-soft text-accent-on-soft",
  magenta: "bg-magenta-soft text-magenta-on-soft",
} as const;

type Tone = keyof typeof TONES;

/** back-compat with the old variant names */
const VARIANT_TONE: Record<string, Tone> = {
  info: "cyan",
  neutral: "neutral",
  success: "violet",
  danger: "magenta",
};

export function Badge({
  tone,
  variant,
  className = "",
  children,
}: {
  tone?: Tone;
  /** @deprecated use `tone` */
  variant?: "info" | "neutral" | "success" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  const resolved: Tone = tone ?? (variant ? VARIANT_TONE[variant] : "neutral");
  return (
    <span
      className={`inline-flex items-center rounded-chip px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${TONES[resolved]} ${className}`}
    >
      {children}
    </span>
  );
}
