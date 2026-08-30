import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ProfileMediaUpload } from "@/components/profile-media-upload";
import { LinkButton } from "@/components/ui";
import { companyStepProgress } from "@/lib/onboarding";

export const metadata = {
  title: "Set up your company",
  robots: { index: false },
};

export default async function CompanyLogoStep() {
  if (!isSupabaseConfigured()) notFound();
  const { company } = await requireCompanyUser("/company/onboarding/logo");
  const { current, total } = companyStepProgress("logo");

  return (
    <OnboardingShell subtitle="Set up your company so students can find your roles.">
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">Add your logo</h1>
      <p className="mt-2 text-sm text-text-muted">
        Optional — a branded tile stands in until you do.
      </p>

      <div className="mt-8">
        <ProfileMediaUpload
          kind="avatar"
          currentUrl={company?.logo_url ?? null}
          label="Logo"
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Link
          href="/company/onboarding/details"
          className="inline-flex min-h-11 items-center font-mono text-xs text-text-muted transition hover:text-text"
        >
          ← Back
        </Link>
        <LinkButton href="/company/onboarding/opportunity" variant="primary">
          Continue
        </LinkButton>
      </div>
    </OnboardingShell>
  );
}
