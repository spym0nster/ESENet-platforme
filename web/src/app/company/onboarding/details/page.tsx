import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { CompanyDetailsForm } from "@/components/onboarding/company-details-form";
import { companyStepProgress } from "@/lib/onboarding";

export const metadata = {
  title: "Set up your company",
  robots: { index: false },
};

export default async function CompanyDetailsStep() {
  if (!isSupabaseConfigured()) notFound();
  const { company } = await requireCompanyUser("/company/onboarding/details");
  const { current, total } = companyStepProgress("details");

  return (
    <OnboardingShell subtitle="Set up your company so students can find your roles.">
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">
        Tell students about your company
      </h1>
      <CompanyDetailsForm
        companyName={company?.company_name ?? ""}
        website={company?.website ?? null}
        description={company?.description ?? null}
        nextHref="/company/onboarding/logo"
      />
    </OnboardingShell>
  );
}
