import { redirect } from "next/navigation";
import { guardStudentStep } from "@/lib/onboarding-guard";
import {
  studentStepProgress,
  nextQuery,
  ONBOARDING_CV_ENABLED,
} from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { CvForm } from "@/components/onboarding/cv-form";

export default async function CvStep({
  searchParams,
}: PageProps<"/onboarding/cv">) {
  // Built, but shipped disabled — the cvs bucket hasn't been security-audited
  // (see SECURITY_PERFORMANCE_AUDIT.md). While off, this step isn't in the
  // sequence and a direct hit falls through to the resume redirect.
  if (!ONBOARDING_CV_ENABLED) redirect("/onboarding");

  const { next } = await guardStudentStep("cv", (await searchParams).next);
  const { current, total } = studentStepProgress("cv");

  return (
    <>
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">Add your CV?</h1>
      <p className="mt-2 text-sm text-text-muted">
        Optional — it helps companies and lets us suggest better matches.
      </p>
      <CvForm next={next} backHref={`/onboarding/education${nextQuery(next)}`} />
    </>
  );
}
