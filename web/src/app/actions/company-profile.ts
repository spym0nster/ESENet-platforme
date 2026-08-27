"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";

export type CompanyProfileState = { error: string } | { success: true } | null;

export async function updateCompanyProfile(
  _prevState: CompanyProfileState,
  formData: FormData
): Promise<CompanyProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in as a company to do this." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "company") {
    return { error: "Only company accounts can do this." };
  }

  const companyId = await resolveCompanyId(supabase, user.id);
  if (!companyId) {
    return { error: "You're not attached to a company yet." };
  }

  const companyName = String(formData.get("company_name") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (companyName.length < 2) {
    return { error: "Company name is required." };
  }

  // Deliberately never touches `verified` (admin-only, enforced by a DB
  // trigger — see docs/QA.md) or `logo_url`/`banner_url` (owned exclusively
  // by the upload flow in actions/profile-media.ts — this form doesn't
  // carry those fields at all, so there's nothing here that could
  // overwrite an uploaded image with a stale value).
  const { error } = await supabase
    .from("companies")
    .update({
      company_name: companyName,
      website: website || null,
      description: description || null,
    })
    .eq("profile_id", companyId);

  if (error) {
    console.error("updateCompanyProfile failed:", error);
    return { error: "We couldn't save your profile. Please try again." };
  }

  revalidatePath("/company/profile");
  revalidatePath("/company/dashboard");
  return { success: true };
}
