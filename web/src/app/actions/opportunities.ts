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

type ParsedOpportunity = {
  type: string;
  title: string;
  description: string;
  location: string | null;
  remote: boolean;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  skills: string[];
};

/** Today's date as an ISO `YYYY-MM-DD` string, for comparing against `date` columns. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Shared validation for create + edit. */
function parseOpportunityForm(
  formData: FormData,
  { isCreate }: { isCreate: boolean }
): { values: ParsedOpportunity; fieldErrors: Record<string, string> } {
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const remote = formData.get("remote") === "on";
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const deadline = String(formData.get("application_deadline") ?? "").trim();
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
  // A brand-new posting with an already-passed deadline is almost certainly a
  // mistake, so block it on create. On edit we allow a past date — that's how
  // a company deliberately closes applications early.
  if (deadline && isCreate && deadline < todayIso()) {
    fieldErrors.application_deadline = "The application deadline can't be in the past.";
  }

  let skills: string[] = [];
  try {
    const parsed = JSON.parse(skillsRaw);
    if (Array.isArray(parsed)) {
      skills = parsed.map((s) => String(s).trim()).filter(Boolean).slice(0, 15);
    }
  } catch {
    // ignore malformed skills payload, treat as empty
  }

  return {
    values: {
      type,
      title,
      description,
      location: location || null,
      remote,
      start_date: startDate || null,
      end_date: endDate || null,
      application_deadline: deadline || null,
      skills,
    },
    fieldErrors,
  };
}

/** Auth + role + company resolution, shared by create/edit/status. */
async function requireCompanyIdForOpportunity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, companyId: null, error: "You must be signed in." } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "company") {
    return { supabase, companyId: null, error: "You don't have permission to do this." } as const;
  }

  const companyId = await resolveCompanyId(supabase, user.id);
  if (!companyId) {
    return { supabase, companyId: null, error: "You're not attached to a company yet." } as const;
  }
  return { supabase, companyId, error: null } as const;
}

export async function createOpportunity(
  _prevState: OpportunityState,
  formData: FormData
): Promise<OpportunityState> {
  const { supabase, companyId, error: authError } = await requireCompanyIdForOpportunity();
  if (!companyId) return { error: authError ?? "You don't have permission to do this." };

  const { values, fieldErrors } = parseOpportunityForm(formData, { isCreate: true });
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  // company_id is never read from the form — always resolved server-side
  // (also enforced by the "companies manage their own opportunities" RLS
  // policy on insert). Defaulting straight to "published" — visibility is
  // still gated by companies.verified.
  const { error } = await supabase.from("opportunities").insert({
    company_id: companyId,
    ...values,
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

export async function updateOpportunity(
  opportunityId: string,
  _prevState: OpportunityState,
  formData: FormData
): Promise<OpportunityState> {
  const { supabase, companyId, error: authError } = await requireCompanyIdForOpportunity();
  if (!companyId) return { error: authError ?? "You don't have permission to do this." };

  const { values, fieldErrors } = parseOpportunityForm(formData, { isCreate: false });
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  // Scoped to this company's own row — RLS ("companies update their own
  // opportunities", is_company_actor) enforces it independently. status is
  // untouched here; open/close is a separate action.
  const { error } = await supabase
    .from("opportunities")
    .update(values)
    .eq("id", opportunityId)
    .eq("company_id", companyId);

  if (error) {
    console.error("updateOpportunity failed:", error);
    return { error: "We couldn't save your changes. Please try again." };
  }

  revalidatePath("/company/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  redirect("/company/dashboard?updated=1");
}

export type StatusToggleState = { error: string } | { success: true } | null;

export async function setOpportunityStatus(
  _prevState: StatusToggleState,
  formData: FormData
): Promise<StatusToggleState> {
  const opportunityId = String(formData.get("opportunity_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "published" && status !== "closed") {
    return { error: "Invalid status." };
  }

  const { supabase, companyId, error: authError } = await requireCompanyIdForOpportunity();
  if (!companyId) return { error: authError ?? "You don't have permission to do this." };

  const { error } = await supabase
    .from("opportunities")
    .update({ status })
    .eq("id", opportunityId)
    .eq("company_id", companyId);

  if (error) {
    console.error("setOpportunityStatus failed:", error);
    return { error: "We couldn't update this opportunity. Please try again." };
  }

  revalidatePath("/company/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { success: true };
}
