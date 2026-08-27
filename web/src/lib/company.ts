import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves which company an authenticated user acts for: either they own
 * one directly (companies.profile_id === userId — the original 1:1 model),
 * or they're a team member added via an invite (company_members). Returns
 * null if neither, meaning this user isn't attached to any company.
 *
 * This is the one place that answers "what company_id should this request
 * use" — every company-scoped action/page should resolve through this
 * rather than assuming company_id === the logged-in user's own id.
 */
export async function resolveCompanyId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: owned } = await supabase
    .from("companies")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();
  if (owned) return owned.profile_id;

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userId)
    .maybeSingle();

  return membership?.company_id ?? null;
}
