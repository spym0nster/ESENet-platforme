import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-accent text-white",
  secondary: "border border-border text-text-muted hover:text-text",
  ghost: "text-accent-2 hover:text-text",
} as const;

type Variant = keyof typeof VARIANTS;

const base =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 font-mono text-sm transition disabled:opacity-60";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${base} ${VARIANTS[variant]} ${className}`} {...props} />
  );
}

/** Same visual treatment as Button, for a same-page navigation action (e.g. "Cancel"). */
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
