/**
 * Onboarding flow config + resume logic. See web/docs/ONBOARDING.md.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** The Goals step's cards — a subset of opportunity_type. Freelance is out
 *  (it's in the deferred freelance module). */
export const GOAL_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "pfe", label: "PFE" },
  { value: "job", label: "Job" },
  { value: "alternance", label: "Alternance" },
] as const;

export const GOAL_TYPE_VALUES = GOAL_TYPES.map((g) => g.value) as string[];
export const MAX_GOAL_TYPES = 3;

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

/** `?next=` → the URL query fragment to thread through the flow. */
export function nextQuery(next: string | null): string {
  const safe = safeNext(next);
  return safe ? `?next=${encodeURIComponent(safe)}` : "";
}

// ---------- resume logic ----------

export type OnboardingSnapshot = {
  fullName: string;
  headline: string | null;
  goalTypes: string[];
  lookingFor: string | null;
  skills: string[];
  onboardedAt: string | null;
  hasEducation: boolean;
  education: {
    school: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    graduationYear: number | null;
  } | null;
};

/** One read of everything the resume redirect and the step guards need. */
export async function fetchOnboardingSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingSnapshot | null> {
  const [{ data: profile }, { data: details }, { data: edu }] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      supabase
        .from("student_details")
        .select("headline, goal_types, looking_for, skills, onboarded_at")
        .eq("profile_id", userId)
        .maybeSingle(),
      supabase
        .from("education")
        .select("school, degree, field_of_study, graduation_year")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!profile || !details) return null;
  return {
    fullName: profile.full_name ?? "",
    headline: details.headline ?? null,
    goalTypes: (details.goal_types as string[] | null) ?? [],
    lookingFor: (details.looking_for as string | null) ?? null,
    skills: (details.skills as string[] | null) ?? [],
    onboardedAt: (details.onboarded_at as string | null) ?? null,
    hasEducation: Boolean(edu),
    education: edu
      ? {
          school: (edu.school as string | null) ?? null,
          degree: (edu.degree as string | null) ?? null,
          fieldOfStudy: (edu.field_of_study as string | null) ?? null,
          graduationYear: (edu.graduation_year as number | null) ?? null,
        }
      : null,
  };
}

/**
 * The earliest step whose data isn't filled in. When every required step is
 * done but `onboarded_at` still isn't set (CV disabled), this points back at
 * `education` — its submit is what stamps the finish line.
 */
export function firstIncompleteStep(s: OnboardingSnapshot): StudentStep {
  if (s.goalTypes.length === 0) return "goals";
  if (!s.fullName.trim() || !s.headline) return "identity";
  if (s.skills.length === 0) return "skills";
  if (!s.hasEducation) return "education";
  if (ONBOARDING_CV_ENABLED) return "cv";
  return "education";
}

/** May the viewer be on `step`? Any completed step, plus the first incomplete one. */
export function canVisitStep(s: OnboardingSnapshot, step: StudentStep): boolean {
  const target = firstIncompleteStep(s);
  return STUDENT_STEPS.indexOf(step) <= STUDENT_STEPS.indexOf(target);
}

// ---------- skill suggestions (Skills step) ----------

const SEED_SKILLS = [
  "SQL",
  "Python",
  "Power BI",
  "Excel",
  "JavaScript",
  "React",
  "Node.js",
  "TypeScript",
  "Java",
  "Git",
  "Figma",
  "SAP",
  "Odoo",
  "Data analysis",
  "Digital marketing",
  "Project management",
];

/**
 * Skills to suggest on the Skills step — the ones opportunities actually ask
 * for, most-common first. Falls back to a static ESEN-relevant list when the
 * marketplace is too thin (a fresh environment). Read-only aggregate, no
 * schema dependency.
 */
export async function fetchSkillSuggestions(
  supabase: SupabaseClient,
  limit = 24
): Promise<string[]> {
  const { data } = await supabase
    .from("opportunities")
    .select("skills")
    .eq("status", "published");

  const freq = new Map<string, number>();
  for (const row of data ?? []) {
    for (const raw of (row.skills as string[] | null) ?? []) {
      const s = raw.trim();
      if (s) freq.set(s, (freq.get(s) ?? 0) + 1);
    }
  }

  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);

  const merged: string[] = [];
  for (const s of [...ranked, ...SEED_SKILLS]) {
    if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) merged.push(s);
    if (merged.length >= limit) break;
  }
  return merged;
}
