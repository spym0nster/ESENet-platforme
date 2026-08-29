/**
 * An empty screen is an invitation, not an apology. A real surface (not a
 * dashed outline), a violet-tinted icon, a title that names the situation,
 * one line that says what to do next — pass a real number in it from the
 * caller ("27 opportunities are open right now") — and one action.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-6 py-10 text-center [box-shadow:var(--lift)]">
      <div
        aria-hidden
        className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"
      >
        {icon ?? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8.5v7M8.5 12h7" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-text">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
