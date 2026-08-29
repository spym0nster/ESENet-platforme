import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

/**
 * Three levels, distinguishable at a glance:
 * - `primary`  — solid violet, the one loud action on a screen
 * - `secondary`— transparent with a real edge; violet wash on hover
 * - `ghost`    — text only, for low-stakes actions (Cancel, dismiss)
 *
 * Labels are Manrope (mono buttons read as "developer tool"). They're verbs
 * and stay identical through a flow: the button says "Apply", the timeline
 * later says "Applied", not "Application submitted".
 */
const VARIANTS = {
  primary: "bg-accent text-white [box-shadow:var(--btn-shadow)]",
  secondary:
    "border border-border-strong text-text hover:border-accent hover:bg-accent/10",
  ghost: "text-text-muted hover:bg-text/8 hover:text-text",
} as const;

type Variant = keyof typeof VARIANTS;

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ctrl px-4 py-2 " +
  "font-sans text-sm font-semibold transition duration-150 ease-out " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-60 " +
  "motion-reduce:active:translate-y-0";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${base} ${VARIANTS[variant]} ${className}`} {...props} />
  );
}

/** Button treatment on a link, for a same-page navigation action. */
export function LinkButton({
  variant = "secondary",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}
