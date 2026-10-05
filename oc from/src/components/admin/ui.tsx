import type { CandidateStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/constants";
import { scoreBand } from "@/lib/matching";
import { cn } from "@/lib/utils";

/** Page title block used at the top of every staff page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight [font-stretch:112%] sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<CandidateStatus, string> = {
  PENDING: "border-line-strong text-muted",
  SHORTLISTED: "border-azure/50 text-azure bg-azure/8",
  SELECTED: "border-green/50 text-green bg-green/8",
  WAITLIST: "border-gold/50 text-gold bg-gold/8",
  REJECTED: "border-danger/40 text-danger/90 bg-danger/6",
};

export function StatusBadge({ status, className }: { status: CandidateStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 border px-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] whitespace-nowrap",
        STATUS_STYLE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function DemoTag() {
  return (
    <span className="inline-flex h-5 items-center border border-gold/50 px-1.5 font-mono text-[9px] tracking-[0.16em] text-gold" title="Development fixture — remove with npm run demo:clear">
      DEMO
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center border border-line-strong px-2 text-xs text-muted whitespace-nowrap", className)}>{children}</span>
  );
}

export function Panel({
  title,
  eyebrow,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow text-dim">{eyebrow}</p>}
            {title && <h2 className="truncate font-mono text-xs font-medium uppercase tracking-[0.18em] text-text">{title}</h2>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** used / capacity bar. Turns gold when full, red when over. */
export function CapacityBar({ used, capacity, label, large }: { used: number; capacity: number; label?: React.ReactNode; large?: boolean }) {
  const ratio = capacity > 0 ? used / capacity : 0;
  const over = capacity > 0 && used > capacity;
  const full = capacity > 0 && used === capacity;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        {label && <span className={cn("truncate", large ? "text-base font-semibold" : "text-sm")}>{label}</span>}
        <span className={cn("tabular font-mono", large ? "text-lg" : "text-xs", over ? "text-danger" : full ? "text-gold" : "text-muted")}>
          {used}
          <span className="text-dim"> / {capacity > 0 ? capacity : "—"}</span>
        </span>
      </div>
      <div className={cn("mt-2 w-full bg-surface-3", large ? "h-2" : "h-1")} role="meter" aria-valuemin={0} aria-valuemax={capacity || 1} aria-valuenow={used} aria-label={typeof label === "string" ? `${label} capacity` : "Capacity"}>
        <div
          className={cn("h-full transition-[width] duration-500", over ? "bg-danger" : full ? "bg-gold" : "bg-gradient-brand")}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function ScorePill({ score, className }: { score: number; className?: string }) {
  const band = scoreBand(score);
  return (
    <span
      className={cn(
        "tabular inline-flex h-6 min-w-12 items-center justify-center border px-1.5 font-mono text-xs font-semibold",
        band === "strong" && "border-green/50 text-green",
        band === "good" && "border-azure/50 text-azure",
        band === "weak" && "border-line-strong text-muted",
        band === "none" && "border-line text-dim",
        className,
      )}
    >
      {score}%
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: number | string;
  hint?: React.ReactNode;
  tone?: "default" | "azure" | "green" | "gold" | "danger";
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow text-dim">{label}</p>
      <p
        className={cn(
          "tabular mt-3 font-display text-4xl font-extrabold [font-stretch:112%]",
          tone === "azure" && "text-azure",
          tone === "green" && "text-green",
          tone === "gold" && "text-gold",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = "block bg-surface p-4 sm:p-5 transition-colors";
  return href ? (
    <a href={href} className={cn(cls, "hover:bg-surface-2")}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line-strong px-6 py-14 text-center">
      <svg width="56" height="24" viewBox="0 0 56 24" aria-hidden className="mb-4 text-line-strong">
        <path d="M4 20 L18 20 L28 6 L40 6 L52 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="4" cy="20" r="2.5" fill="currentColor" />
        <circle cx="28" cy="6" r="2.5" fill="currentColor" />
        <circle cx="52" cy="6" r="2.5" fill="none" stroke="currentColor" />
      </svg>
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
