/**
 * A nudge shown at the top of /profile until the student's profile is
 * complete enough to look good in the /students directory and to companies
 * reviewing applicants. Pure presentation — the checks are computed by the
 * page from data it already fetched.
 */
export function ProfileCompleteness({
  checks,
}: {
  checks: { label: string; done: boolean }[];
}) {
  const done = checks.filter((c) => c.done).length;
  const total = checks.length;
  const pct = Math.round((done / total) * 100);

  if (done === total) return null;

  const missing = checks.filter((c) => !c.done);

  return (
    <div className="mt-8 rounded-lg border border-accent-2/40 bg-accent2-soft/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent-2">
          Profile {pct}% complete
        </h2>
        <span className="font-mono text-xs text-text-faint">
          {done}/{total}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full bg-accent-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-text-muted">
        Still to add:{" "}
        <span className="text-text">
          {missing.map((c) => c.label).join(", ")}
        </span>
        .
      </p>
    </div>
  );
}
