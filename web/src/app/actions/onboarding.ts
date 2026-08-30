"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { patchStudentDetails } from "@/lib/students";
import {
  GOAL_TYPE_VALUES,
  MAX_GOAL_TYPES,
  ONBOARDING_CV_ENABLED,
  ONBOARDING_DONE_FALLBACK,
  nextQuery,
  safeNext,
} from "@/lib/onboarding";

export type OnboardingStepState = { error: string } | null;

const MAX_CV_BYTES = 5 * 1024 * 1024;

async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "student") redirect("/");

  return { supabase, user };
}

function parseJsonArray(raw: unknown): string[] {
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(parsed)
      ? parsed.map((s) => String(s).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

/** After the last step: stamp the finish line, then leave onboarding. */
async function finish(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  next: string | null
): Promise<never> {
  await patchStudentDetails(supabase, userId, {
    onboarded_at: new Date().toISOString(),
  });
  revalidatePath("/students");
  revalidatePath("/", "layout");
  redirect(safeNext(next) ?? ONBOARDING_DONE_FALLBACK);
}

// ---------- step 1 · goals ----------

export async function saveGoals(
  _prev: OnboardingStepState,
  formData: FormData
): Promise<OnboardingStepState> {
  const { supabase, user } = await requireStudent();
  const next = String(formData.get("next") ?? "") || null;

  const goalTypes = parseJsonArray(formData.get("goal_types"))
    .filter((t) => GOAL_TYPE_VALUES.includes(t))
    .slice(0, MAX_GOAL_TYPES);
  if (goalTypes.length === 0) {
    return { error: "Pick at least one." };
  }
  const interests = String(formData.get("interests") ?? "").trim().slice(0, 200);

  const { error } = await patchStudentDetails(supabase, user.id, {
    goal_types: goalTypes,
    looking_for: interests || null,
  });
  if (error) {
    console.error("saveGoals failed:", error);
    return { error: "We couldn't save that. Please try again." };
  }

  redirect(`/onboarding/identity${nextQuery(next)}`);
}

// ---------- step 2 · identity ----------

export async function saveIdentity(
  _prev: OnboardingStepState,
  formData: FormData
): Promise<OnboardingStepState> {
  const { supabase, user } = await requireStudent();
  const next = String(formData.get("next") ?? "") || null;

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  const headline = String(formData.get("headline") ?? "").trim().slice(0, 160);
  if (!fullName) return { error: "Your name can't be blank." };
  if (!headline) return { error: "Add a short headline." };

  const [{ error: pErr }, { error: dErr }] = await Promise.all([
    supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id),
    patchStudentDetails(supabase, user.id, { headline }),
  ]);
  if (pErr || dErr) {
    console.error("saveIdentity failed:", pErr ?? dErr);
    return { error: "We couldn't save that. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect(`/onboarding/skills${nextQuery(next)}`);
}

// ---------- step 3 · skills ----------

export async function saveSkills(
  _prev: OnboardingStepState,
  formData: FormData
): Promise<OnboardingStepState> {
  const { supabase, user } = await requireStudent();
  const next = String(formData.get("next") ?? "") || null;

  const skills = [...new Set(parseJsonArray(formData.get("skills")))].slice(0, 20);
  if (skills.length === 0) {
    return { error: "Add at least one skill." };
  }

  const { error } = await patchStudentDetails(supabase, user.id, { skills });
  if (error) {
    console.error("saveSkills failed:", error);
    return { error: "We couldn't save that. Please try again." };
  }

  redirect(`/onboarding/education${nextQuery(next)}`);
}

// ---------- step 4 · education ----------

export async function saveEducation(
  _prev: OnboardingStepState,
  formData: FormData
): Promise<OnboardingStepState> {
  const { supabase, user } = await requireStudent();
  const next = String(formData.get("next") ?? "") || null;

  const school = String(formData.get("school") ?? "").trim().slice(0, 160);
  const degree = String(formData.get("degree") ?? "").trim().slice(0, 120);
  const fieldOfStudy = String(formData.get("field_of_study") ?? "")
    .trim()
    .slice(0, 200);
  const yearRaw = parseInt(String(formData.get("graduation_year") ?? ""), 10);
  const gradYear = Number.isFinite(yearRaw) ? yearRaw : null;

  if (!school) return { error: "Where do you study?" };
  if (!gradYear) return { error: "Pick your graduation year." };
  if (!degree) return { error: "What degree?" };

  const row = {
    profile_id: user.id,
    school,
    degree,
    field_of_study: fieldOfStudy || null,
    graduation_year: gradYear,
  };

  // Edit the row this flow created rather than adding a second one on a
  // revisit; otherwise insert.
  const { data: existing } = await supabase
    .from("education")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("education").update(row).eq("id", existing.id)
    : await supabase.from("education").insert(row);

  if (error) {
    console.error("saveEducation failed:", error);
    return { error: "We couldn't save that. Please try again." };
  }
  revalidatePath("/profile");

  if (ONBOARDING_CV_ENABLED) {
    redirect(`/onboarding/cv${nextQuery(next)}`);
  }
  return finish(supabase, user.id, next);
}

// ---------- step 5 · CV (behind ONBOARDING_CV_ENABLED) ----------

export async function saveCv(
  _prev: OnboardingStepState,
  formData: FormData
): Promise<OnboardingStepState> {
  const { supabase, user } = await requireStudent();
  const next = String(formData.get("next") ?? "") || null;

  if (!ONBOARDING_CV_ENABLED) redirect("/onboarding");

  const file = formData.get("cv");
  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf") return { error: "CVs must be a PDF." };
    if (file.size > MAX_CV_BYTES) return { error: "CV must be under 5MB." };

    const path = `${user.id}/cv.pdf`;
    const { error: upErr } = await supabase.storage
      .from("cvs")
      .upload(path, file, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      console.error("saveCv upload failed:", upErr);
      return { error: "We couldn't upload your CV. Please try again." };
    }
    await patchStudentDetails(supabase, user.id, { cv_url: path });
  }

  return finish(supabase, user.id, next);
}

export async function skipCv(formData: FormData): Promise<void> {
  const { supabase, user } = await requireStudent();
  const next = String(formData.get("next") ?? "") || null;
  return finish(supabase, user.id, next);
}
