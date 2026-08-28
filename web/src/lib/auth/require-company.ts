import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";

/**
 * Server-side guard for /company/* pages. Redirects (never just hides UI)
 * when the request isn't from a signed-in company account, then returns
 * the effective company this user acts for — either the one they own, or
 * the one they were invited into as a team member (see src/lib/company.ts).
 */
export async function requireCompanyUser(nextPath: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "company") {
    redirect("/");
  }

  const companyId = await resolveCompanyId(supabase, user.id);
  if (!companyId) {
    // A company-role profile with no company yet (fresh signup, or a
    // declined/still-pending join request) — send them to the page that
    // actually resolves that, instead of dead-ending at the landing page.
    redirect("/company/onboarding");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("profile_id, company_name, website, logo_url, banner_url, description, verified")
    .eq("profile_id", companyId)
    .single();

  const { data: membership } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("profile_id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    company,
    companyId,
    isOwner: membership?.role === "owner",
  };
}
