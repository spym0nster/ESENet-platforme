/**
 * The onboarding progress bar. A solid `--accent` fill on a `--surface-alt`
 * track — not the brand gradient (§8). Carries a real accessible label and
 * a visible "Step N of M" text equivalent, not just the graphic.
 */
export function OnboardingProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`Step ${current} of ${total}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-text-faint">
        Step {current} of {total}
      </p>
    </div>
  );
}
