import { guardStudentStep } from "@/lib/onboarding-guard";
import {
  studentStepProgress,
  nextQuery,
  ONBOARDING_CV_ENABLED,
} from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { EducationForm } from "@/components/onboarding/education-form";

export default async function EducationStep({
  searchParams,
}: PageProps<"/onboarding/education">) {
  const { snap, next } = await guardStudentStep(
    "education",
    (await searchParams).next
  );
  const { current, total } = studentStepProgress("education");

  return (
    <>
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">Where do you study?</h1>
      <p className="mt-2 text-sm text-text-muted">
        Just your current or most recent — you can add more from your profile.
      </p>
      <EducationForm
        defaults={
          snap.education ?? {
            school: null,
            degree: null,
            fieldOfStudy: null,
            graduationYear: null,
          }
        }
        isLast={!ONBOARDING_CV_ENABLED}
        next={next}
        backHref={`/onboarding/skills${nextQuery(next)}`}
      />
    </>
  );
}
