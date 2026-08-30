import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OpportunityForm } from "@/components/opportunity-form";
import { companyStepProgress } from "@/lib/onboarding";

export const metadata = {
  title: "Set up your company",
  robots: { index: false },
};

export default async function CompanyFirstOpportunityStep() {
  if (!isSupabaseConfigured()) notFound();
  await requireCompanyUser("/company/onboarding/opportunity");
  const { current, total } = companyStepProgress("opportunity");

  return (
    <OnboardingShell subtitle="Set up your company so students can find your roles.">
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">
        Post your first opportunity?
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        You can do this later — but a live role is why students visit.
      </p>

      <div className="mt-8">
        <OpportunityForm />
      </div>

      <div className="mt-6">
        <Link
          href="/company/dashboard"
          className="inline-flex min-h-11 items-center font-mono text-xs text-text-muted transition hover:text-text"
        >
          Skip — go to the dashboard
        </Link>
      </div>
    </OnboardingShell>
  );
}
