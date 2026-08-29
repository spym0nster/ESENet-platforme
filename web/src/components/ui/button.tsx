import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

/**
 * Three levels, distinguishable at a glance:
 * - `primary`  — solid violet, the one loud action on a screen
 * - `secondary`— transparent with a real edge; violet wash on hover
 * - `ghost`    — text only, for low-stakes actions (Cancel, dismiss)
 *
 * Every variant answers a hover (so it reads as interactive *before* you
 * commit) and presses 1px on `:active` (feedback *after*).
 *
 * Two sizes: `default` is 44px (the touch-target floor for a standalone
 * button); `compact` is 36px, for a button that sits inside a dense row —
 * an applicant's status control, a table-row action — where 44px makes the
 * row look inflated. 36px with real spacing around it still clears WCAG.
 *
 * Labels are Manrope (mono buttons read as "dev tool"), verbs, and stay
 * identical through a flow: the button says "Apply", the timeline later
 * says "Applied".
 */
const VARIANTS = {
  primary: "bg-accent text-white [box-shadow:var(--btn-shadow)] hover:brightness-105",
  secondary:
    "border border-border-strong text-text hover:border-accent hover:bg-accent/10",
  ghost: "text-text-muted hover:bg-text/8 hover:text-text",
} as const;

const SIZES = {
  default: "min-h-11 px-4 py-2 text-sm",
  compact: "min-h-9 px-3 text-xs",
} as const;

type Variant = keyof typeof VARIANTS;
type Size = keyof typeof SIZES;

const base =
  "inline-flex items-center justify-center gap-2 rounded-ctrl font-sans font-semibold " +
  "transition duration-150 ease-out active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-60 motion-reduce:active:translate-y-0";

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** Button treatment on a link, for a same-page navigation action. */
export function LinkButton({
  variant = "secondary",
  size = "default",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
