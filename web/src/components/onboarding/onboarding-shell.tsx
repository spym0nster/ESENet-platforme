import { Logo } from "@/components/logo";
import { posterGradient } from "@/lib/poster-gradient";

/**
 * The two-panel onboarding frame, shared by the student flow
 * (`/onboarding/*` via its layout) and the company flow
 * (`/company/onboarding*`, which wraps its pages in this directly rather
 * than a route group).
 *
 * The left panel is the poster gradient + wordmark + one line — specced in
 * ONBOARDING.md and in the original brief. It's a deliberate exception to
 * §8's "gradient in two places" count: onboarding is a conversion funnel,
 * not signed-in product chrome. Don't "fix" it away.
 */
export function OnboardingShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col md:flex-row">
      <aside
        className="flex shrink-0 flex-col gap-6 px-6 py-8 text-white md:w-[38%] md:justify-between md:px-10 md:py-14"
        style={{ backgroundImage: posterGradient("160deg") }}
      >
        <Logo className="h-6 w-auto" />
        <p className="max-w-[16rem] font-display text-lg font-semibold leading-snug">
          {subtitle}
        </p>
        <span aria-hidden className="hidden md:block" />
      </aside>

      <div className="flex-1 px-6 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-lg">{children}</div>
      </div>
    </div>
  );
}
