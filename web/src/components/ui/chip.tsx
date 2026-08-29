/**
 * A skill tag. `match` paints it cyan — a skill the viewer has that this
 * opportunity asks for. Neutral otherwise. The same overlap, shown twice
 * (here and in the arc), cheaply.
 */
export function Chip({
  match = false,
  className = "",
  children,
}: {
  match?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-chip border px-2 py-0.5 font-mono text-[11px] ${
        match
          ? "border-accent-2/30 bg-accent2-soft text-accent-2"
          : "border-border bg-text/6 text-text-muted"
      } ${className}`}
    >
      {children}
    </span>
  );
}
