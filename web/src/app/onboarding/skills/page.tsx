import { guardStudentStep } from "@/lib/onboarding-guard";
import {
  studentStepProgress,
  nextQuery,
  fetchSkillSuggestions,
} from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { SkillsForm } from "@/components/onboarding/skills-form";

export default async function SkillsStep({
  searchParams,
}: PageProps<"/onboarding/skills">) {
  const { supabase, snap, next } = await guardStudentStep(
    "skills",
    (await searchParams).next
  );
  const { current, total } = studentStepProgress("skills");
  const suggestions = await fetchSkillSuggestions(supabase);

  return (
    <>
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">
        What are you good at?
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Tap the ones that fit, or add your own.
      </p>
      <SkillsForm
        suggestions={suggestions}
        defaultSkills={snap.skills}
        next={next}
        backHref={`/onboarding/identity${nextQuery(next)}`}
      />
    </>
  );
}
