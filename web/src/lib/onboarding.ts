/**
 * Onboarding flow config. See web/docs/ONBOARDING.md.
 */

/**
 * The CV step is built but not enabled — the `cvs` bucket and its policies
 * have never been through a security review (tracked in
 * SECURITY_PERFORMANCE_AUDIT.md), and every new student shouldn't be routed
 * into an unaudited upload path. Flip this to `true` only after that audit.
 *
 * While `false`: `/onboarding/cv` is not in the step sequence, the progress
 * bar total is 4, and the Education step is the last one — it's what stamps
 * `student_details.onboarded_at`.
 */
export const ONBOARDING_CV_ENABLED = false;

const ALL_STUDENT_STEPS = [
  "goals",
  "identity",
  "skills",
  "education",
  "cv",
] as const;

export type StudentStep = (typeof ALL_STUDENT_STEPS)[number];

/** Student flow, in order. `/onboarding` (index) resume-redirects into it. */
export const STUDENT_STEPS: StudentStep[] = ONBOARDING_CV_ENABLED
  ? [...ALL_STUDENT_STEPS]
  : ALL_STUDENT_STEPS.filter((s) => s !== "cv");

/** 1-based position + total, for the progress bar. */
export function studentStepProgress(step: StudentStep): {
  current: number;
  total: number;
} {
  return {
    current: STUDENT_STEPS.indexOf(step) + 1,
    total: STUDENT_STEPS.length,
  };
}

/** Company flow, in order. `/company/onboarding` is step 1 (create-or-join). */
export const COMPANY_STEPS = [
  "create",
  "details",
  "logo",
  "opportunity",
] as const;

export type CompanyStep = (typeof COMPANY_STEPS)[number];

export function companyStepProgress(step: CompanyStep): {
  current: number;
  total: number;
} {
  return {
    current: COMPANY_STEPS.indexOf(step) + 1,
    total: COMPANY_STEPS.length,
  };
}

/** Where a completed onboarding lands, if there's no `?next=`. */
export const ONBOARDING_DONE_FALLBACK = "/opportunities";

/** Keep `?next=` same-site only, like `signIn` already does. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}
