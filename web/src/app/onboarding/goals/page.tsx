import { guardStudentStep } from "@/lib/onboarding-guard";
import { studentStepProgress } from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { GoalsForm } from "@/components/onboarding/goals-form";

export default async function GoalsStep({
  searchParams,
}: PageProps<"/onboarding/goals">) {
  const { snap, next } = await guardStudentStep("goals", (await searchParams).next);
  const { current, total } = studentStepProgress("goals");

  return (
    <>
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">
        What are you looking for?
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Pick up to 3 — we use them to surface the right opportunities.
      </p>
      <GoalsForm
        defaultGoals={snap.goalTypes}
        defaultInterests={snap.lookingFor}
        next={next}
      />
    </>
  );
}
