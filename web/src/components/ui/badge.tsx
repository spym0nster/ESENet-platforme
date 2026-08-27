const VARIANTS = {
  info: "bg-accent2-soft text-accent-2",
  neutral: "bg-surface-alt text-text-faint",
  success: "text-accent-on-soft",
  danger: "text-magenta",
} as const;

type Variant = keyof typeof VARIANTS;

// bg-accent-soft / bg-magenta-soft aren't Tailwind utilities generated from
// the token set (only their *-on-soft text tokens are exposed that way),
// so these two variants set the background directly from the CSS variable.
const INLINE_BG: Partial<Record<Variant, string>> = {
  success: "var(--accent-soft)",
  danger: "var(--magenta-soft)",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: Variant;
  children: React.ReactNode;
}) {
  const background = INLINE_BG[variant];
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${VARIANTS[variant]}`}
      style={background ? { background } : undefined}
    >
      {children}
    </span>
  );
}
