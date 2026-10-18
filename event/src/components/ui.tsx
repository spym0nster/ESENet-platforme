import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

// "01 — The edition". Numbered mono labels carry the page structure instead
// of icons.
export function SectionLabel({
  n,
  children,
  tone = "dark",
}: {
  n: string;
  children: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <p
      className={`flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.28em] ${
        tone === "dark" ? "text-mist/80" : "text-ink/60"
      }`}
    >
      <span className={tone === "dark" ? "text-cyan-bright" : "text-teal"}>{n}</span>
      <span aria-hidden className={`h-px w-8 ${tone === "dark" ? "bg-white/25" : "bg-ink/25"}`} />
      {children}
    </p>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`size-4 shrink-0 ${className}`} fill="none">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}

type Variant = "primary" | "ghost" | "ink";

const variants: Record<Variant, string> = {
  primary: "bg-green text-night hover:bg-snow",
  ghost: "border border-white/30 text-snow hover:border-snow hover:bg-white/[0.06]",
  ink: "bg-ink text-snow hover:bg-blue",
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" }) {
  const sizing = size === "sm" ? "h-10 px-5 text-[14px]" : "h-12 px-6 text-[15px]";
  return (
    <Link
      {...props}
      className={`group inline-flex items-center gap-3 whitespace-nowrap rounded-full font-semibold tracking-tight transition-colors duration-200 ${sizing} ${variants[variant]} ${className}`}
    >
      {children}
      <Arrow className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

// The brand's "molecule" motif: point (data) → ring (intelligence) →
// square (value). Used as small separators, never as decoration for its own
// sake.
export function Glyph({ kind, className = "" }: { kind: 0 | 1 | 2; className?: string }) {
  if (kind === 0) return <span aria-hidden className={`inline-block size-2 rounded-full bg-blue-light ${className}`} />;
  if (kind === 1)
    return <span aria-hidden className={`inline-block size-2.5 rounded-full border-2 border-cyan ${className}`} />;
  return <span aria-hidden className={`inline-block size-2 bg-green ${className}`} />;
}
