"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";
import { notify, companyActorIds } from "@/lib/notifications";

export type OnboardingState = { error: string } | { success: true } | null;

/**
 * Shared guard for every action here: must be signed in, must be a
 * company-role profile, and — unlike requireCompanyActor() in
 * company-team.ts — must NOT already resolve to a company. Creating a
 * second company or requesting to join one while already attached to a
 * company isn't supported (a person acts for one company at a time in this
 * model); leaving/transferring is a separate, not-yet-built feature.
 */
async function requireUnattachedCompanyUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "You must be signed in." } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "company") {
    return { supabase, user: null, error: "Only company accounts can do this." } as const;
  }

  const existingCompanyId = await resolveCompanyId(supabase, user.id);
  if (existingCompanyId) {
    return { supabase, user: null, error: "You're already attached to a company." } as const;
  }

  return { supabase, user, error: null } as const;
}

export async function createCompany(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  if (!companyName) {
    return { error: "Enter your company's name." };
  }

  const { supabase, user, error: authError } = await requireUnattachedCompanyUser();
  if (!user) return { error: authError ?? "Unexpected error." };

  const { error: companyError } = await supabase
    .from("companies")
    .insert({ profile_id: user.id, company_name: companyName });
  if (companyError) {
    console.error("createCompany insert failed:", companyError);
    return { error: "We couldn't create your company. Please try again." };
  }

  const { error: ownerError } = await supabase
    .from("company_members")
    .insert({ company_id: user.id, profile_id: user.id, role: "owner" });
  if (ownerError) {
    console.error("createCompany owner-membership failed:", ownerError);
    return { error: "We couldn't finish setting up your company. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/company/onboarding/details");
}

/**
 * Plain data fetch (not a mutation), used by the onboarding page's search —
 * server-rendered via a ?q= search param, matching how /opportunities
 * already does search, rather than introducing a new client-fetch pattern.
 */
export async function searchCompanies(query: string) {
  const supabase = await createClient();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("companies")
    .select("profile_id, company_name, verified, logo_url")
    .ilike("company_name", `%${trimmed}%`)
    .order("company_name", { ascending: true })
    .limit(10);

  if (error) {
    console.error("searchCompanies failed:", error);
    return [];
  }
  return data;
}

export async function requestToJoinCompany(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const companyId = String(formData.get("company_id") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 500);
  if (!companyId) return { error: "Missing company." };

  const { supabase, user, error: authError } = await requireUnattachedCompanyUser();
  if (!user) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase.from("company_join_requests").insert({
    company_id: companyId,
    profile_id: user.id,
    message: message || null,
  });

  if (error) {
    // Unique violation from the "one pending request per company" index.
    if (error.code === "23505") {
      return { error: "You already have a pending request to this company." };
    }
    console.error("requestToJoinCompany failed:", error);
    return { error: "We couldn't send that request. Please try again." };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  await notify(supabase, {
    recipientIds: await companyActorIds(supabase, companyId),
    actorId: user.id,
    kind: "join_request_received",
    title: "New request to join your company",
    body: `${me?.full_name ?? "Someone"} asked to join${
      message ? `: "${message}"` : "."
    }`,
    link: "/company/team",
  });

  revalidatePath("/company/onboarding");
  return { success: true };
}

export async function cancelJoinRequest(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const requestId = String(formData.get("request_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS ("requester cancels their own pending request") independently
  // restricts this to the requester's own still-pending row.
  const { error } = await supabase
    .from("company_join_requests")
    .delete()
    .eq("id", requestId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("cancelJoinRequest failed:", error);
    return { error: "We couldn't cancel that request." };
  }

  revalidatePath("/company/onboarding");
  return { success: true };
}
