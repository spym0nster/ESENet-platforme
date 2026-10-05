import { cn } from "@/lib/utils";

/** Label + control + hint + error, wired for screen readers (aria-describedby is the caller's job via ids below). */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-text">
        <span>
          {label}
          {required && (
            <span className="ml-1 text-azure" aria-hidden>
              *
            </span>
          )}
        </span>
        {optional && <span className="font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-dim">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: boolean) {
  return [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

/** Numbered section heading used inside each form step. */
export function SectionHeading({ n, title, children }: { n: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-4">
      <p className="font-mono text-xs tracking-[0.18em] text-azure">SECTION {n}</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold uppercase [font-stretch:112%] sm:text-3xl">{title}</h2>
      {children && <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
