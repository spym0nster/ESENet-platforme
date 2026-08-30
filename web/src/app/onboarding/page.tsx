import { redirect } from "next/navigation";
import { requireStudentUser } from "@/lib/auth/require-student";
import {
  fetchOnboardingSnapshot,
  firstIncompleteStep,
  nextQuery,
  ONBOARDING_DONE_FALLBACK,
  safeNext,
} from "@/lib/onboarding";

/**
 * The resume redirect. No UI — it always sends the student to the first
 * step they haven't finished (or out, if they're done). Step state lives in
 * the URL, not here.
 */
export default async function OnboardingIndex({
  searchParams,
}: PageProps<"/onboarding">) {
  const { supabase, user } = await requireStudentUser("/onboarding");
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next);

  const snap = await fetchOnboardingSnapshot(supabase, user.id);
  if (!snap) redirect("/");
  if (snap.onboardedAt) redirect(next ?? ONBOARDING_DONE_FALLBACK);

  redirect(`/onboarding/${firstIncompleteStep(snap)}${nextQuery(next)}`);
}
