/**
 * The signature element. A 46px ring stroked with the poster gradient
 * (cyan → violet → magenta), filled to how many of **this opportunity's**
 * required skills the student already has. The denominator is always the
 * opportunity's skill count, never the student's — a two-skill student
 * matching a two-skill posting must not read as a full ring.
 *
 * This component is dumb: it draws whatever numbers it's handed. The
 * caller decides whether to render it at all — signed out, or a profile
 * with fewer than three skills, means no arc (show a "complete your
 * profile" link instead), never an empty ring.
 *
 * The `<linearGradient id="esenetArc">` it references lives once in the
 * root layout.
 */
export function MatchArc({
  matched,
  required,
  className = "",
}: {
  matched: number;
  required: number;
  className?: string;
}) {
  if (required <= 0) return null;

  const pct = Math.max(0, Math.min(1, matched / required));
  const R = 19.5;
  const CIRC = 2 * Math.PI * R;

  return (
    <div
      role="img"
      aria-label={`${matched} of ${required} required skills match your profile`}
      className={`relative size-[46px] shrink-0 ${className}`}
    >
      <svg viewBox="0 0 46 46" className="size-full -rotate-90" aria-hidden>
        <circle cx="23" cy="23" r={R} fill="none" stroke="var(--border-strong)" strokeWidth="3.5" />
        <circle
          cx="23"
          cy="23"
          r={R}
          fill="none"
          stroke="url(#esenetArc)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[11px] font-semibold tabular-nums text-text">
        {matched}/{required}
      </span>
    </div>
  );
}
