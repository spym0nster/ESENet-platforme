"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";
import type { OpportunityType } from "@/types/database";

export type OpportunityState =
  | { error: string; fieldErrors?: Record<string, string> }
  | { success: true }
  | null;

const OPPORTUNITY_TYPES: OpportunityType[] = [
  "internship",
  "pfe",
  "job",
  "alternance",
  "freelance",
];

export async function createOpportunity(
  _prevState: OpportunityState,
  formData: FormData
): Promise<OpportunityState> {
  const supabase = await createClient();

  // 1. Authentication — never trust a client-supplied identity.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to post an opportunity." };
  }

  // 2. Authorization — the poster must actually hold the company role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "company") {
    return { error: "You don't have permission to post opportunities." };
  }

  // The actual company this user posts for — either the one they own, or
  // the one they were invited into as a team member.
  const companyId = await resolveCompanyId(supabase, user.id);
  if (!companyId) {
    return { error: "You're not attached to a company yet." };
  }

  // 3. Read + validate form input. company_id is never read from the form —
  // it's always resolved server-side above (also enforced independently by
  // the "companies manage their own opportunities" RLS policy on insert).
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const remote = formData.get("remote") === "on";
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const skillsRaw = String(formData.get("skills") ?? "[]");

  const fieldErrors: Record<string, string> = {};

  if (!OPPORTUNITY_TYPES.includes(type as OpportunityType)) {
    fieldErrors.type = "Choose an opportunity type.";
  }
  if (title.length < 3) {
    fieldErrors.title = "Title must be at least 3 characters.";
  } else if (title.length > 120) {
    fieldErrors.title = "Title must be under 120 characters.";
  }
  if (description.length < 20) {
    fieldErrors.description = "Add a bit more detail (at least 20 characters).";
  }
  if (startDate && endDate && endDate < startDate) {
    fieldErrors.end_date = "End date can't be before the start date.";
  }

  let skills: string[] = [];
  try {
    const parsed = JSON.parse(skillsRaw);
    if (Array.isArray(parsed)) {
      skills = parsed
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 15);
    }
  } catch {
    // ignore malformed skills payload, treat as empty
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  // 4. Insert, scoped to the authenticated company. Defaulting straight to
  // "published" — there's no admin moderation queue in this MVP.
  const { error } = await supabase.from("opportunities").insert({
    company_id: companyId,
    type,
    title,
    description,
    skills,
    location: location || null,
    remote,
    start_date: startDate || null,
    end_date: endDate || null,
    status: "published",
  });

  if (error) {
    console.error("createOpportunity insert failed:", error);
    return { error: "We couldn't publish this opportunity. Please try again." };
  }

  revalidatePath("/company/dashboard");
  revalidatePath("/opportunities");
  redirect("/company/dashboard?published=1");
}
