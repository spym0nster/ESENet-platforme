import { redirect } from "next/navigation";
import { requireStudentUser } from "@/lib/auth/require-student";
import {
  canVisitStep,
  fetchOnboardingSnapshot,
  nextQuery,
  ONBOARDING_DONE_FALLBACK,
  safeNext,
  type StudentStep,
} from "@/lib/onboarding";

/**
 * The guard every `/onboarding/*` step page runs. Redirects a non-student
 * away, sends an already-onboarded student out (to `?next=` or the
 * fallback), and bounces a student who jumped ahead back to their resume
 * point. Returns the snapshot + the sanitised `next` for the page to use.
 */
export async function guardStudentStep(
  step: StudentStep,
  rawNext: string | string[] | undefined
) {
  const { supabase, user } = await requireStudentUser(`/onboarding/${step}`);
  const next = safeNext(Array.isArray(rawNext) ? rawNext[0] : rawNext);

  const snap = await fetchOnboardingSnapshot(supabase, user.id);
  if (!snap) redirect("/");
  if (snap.onboardedAt) redirect(next ?? ONBOARDING_DONE_FALLBACK);
  if (!canVisitStep(snap, step)) redirect(`/onboarding${nextQuery(next)}`);

  return { supabase, user, snap, next };
}
