import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpportunityType } from "@/types/database";

export type PublicCompany = {
  id: string;
  company_name: string;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  verified: boolean;
};

export type CompanyOpportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  location: string | null;
  remote: boolean;
};

export type CompanyTeamMember = {
  profile_id: string;
  full_name: string;
  title: string | null;
  role: "owner" | "member";
};

/**
 * A company's public page: the company row (public-read), its currently
 * published opportunities, and its team (public since `0008`, so the
 * "Name · Title" line renders for anyone). Returns null when the id isn't a
 * company. An unverified company still has a page — the row is public
 * anyway — it just shows the unverified state and no opportunities (RLS
 * hides those until an admin verifies).
 */
export async function fetchCompanyProfile(
  supabase: SupabaseClient,
  id: string
): Promise<
  | {
      company: PublicCompany;
      opportunities: CompanyOpportunity[];
      team: CompanyTeamMember[];
    }
  | null
> {
  const { data: company } = await supabase
    .from("companies")
    .select("profile_id, company_name, website, description, logo_url, banner_url, verified")
    .eq("profile_id", id)
    .maybeSingle();

  if (!company) return null;

  const [{ data: opportunities }, { data: members }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, type, title, location, remote")
      .eq("company_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("company_members")
      .select("profile_id, role, title, profiles!inner(full_name)")
      .eq("company_id", id)
      .order("role", { ascending: true }),
  ]);

  return {
    company: {
      id: company.profile_id,
      company_name: company.company_name,
      website: company.website,
      description: company.description,
      logo_url: company.logo_url,
      banner_url: company.banner_url,
      verified: company.verified,
    },
    opportunities: (opportunities ?? []) as CompanyOpportunity[],
    team: ((members ?? []) as unknown as {
      profile_id: string;
      role: "owner" | "member";
      title: string | null;
      profiles: { full_name: string } | null;
    }[])
      .filter((m) => m.profiles)
      .map((m) => ({
        profile_id: m.profile_id,
        full_name: m.profiles!.full_name,
        title: m.title,
        role: m.role,
      })),
  };
}
