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
  skills: string[] | null;
  location: string | null;
  remote: boolean;
  application_deadline: string | null;
};

export type CompanyTeamMember = {
  profile_id: string;
  full_name: string;
  title: string | null;
  role: "owner" | "member";
};

export type DirectoryCompany = {
  id: string;
  company_name: string;
  description: string | null;
  logo_url: string | null;
  openRoles: number;
};

/**
 * The public "who's on ESENet" directory — verified companies only (an
 * unverified company has a page but shouldn't be advertised, and its
 * opportunities are RLS-hidden anyway). Sorted by open-role count then
 * name. Two queries: the company rows, then a single grouped count of
 * their published opportunities.
 */
export async function fetchCompanyDirectory(
  supabase: SupabaseClient,
  opts: { q?: string } = {}
): Promise<DirectoryCompany[]> {
  let query = supabase
    .from("companies")
    .select("profile_id, company_name, description, logo_url")
    .eq("verified", true);

  const q = opts.q?.trim();
  if (q) query = query.ilike("company_name", `%${q}%`);

  const { data: companies, error } = await query;
  if (error) {
    console.error("fetchCompanyDirectory failed:", error);
    return [];
  }
  if (!companies || companies.length === 0) return [];

  const ids = companies.map((c) => c.profile_id as string);
  const { data: openOpps } = await supabase
    .from("opportunities")
    .select("company_id")
    .eq("status", "published")
    .in("company_id", ids);

  const openByCompany = new Map<string, number>();
  for (const row of openOpps ?? []) {
    const cid = row.company_id as string;
    openByCompany.set(cid, (openByCompany.get(cid) ?? 0) + 1);
  }

  return companies
    .map((c) => ({
      id: c.profile_id as string,
      company_name: c.company_name as string,
      description: (c.description as string | null) ?? null,
      logo_url: (c.logo_url as string | null) ?? null,
      openRoles: openByCompany.get(c.profile_id as string) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.openRoles - a.openRoles ||
        a.company_name.localeCompare(b.company_name)
    );
}

/**
 * A company's public page: the company row (public-read), its currently
 * published opportunities, its team (public since `0008`, so the
 * "Name · Title" line renders for anyone), and a count of the posts it has
 * published *as the company* (the bodies are fetched separately, only when
 * the Posts tab is open). Returns null when the id isn't a company. An
 * unverified company still has a page — the row is public anyway — it just
 * shows the unverified state and no opportunities (RLS hides those until an
 * admin verifies).
 */
export async function fetchCompanyProfile(
  supabase: SupabaseClient,
  id: string
): Promise<
  | {
      company: PublicCompany;
      opportunities: CompanyOpportunity[];
      team: CompanyTeamMember[];
      postCount: number;
    }
  | null
> {
  const { data: company } = await supabase
    .from("companies")
    .select("profile_id, company_name, website, description, logo_url, banner_url, verified")
    .eq("profile_id", id)
    .maybeSingle();

  if (!company) return null;

  const [{ data: opportunities }, { data: members }, { count: postCount }] =
    await Promise.all([
      supabase
        .from("opportunities")
        .select("id, type, title, skills, location, remote, application_deadline")
        .eq("company_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("company_members")
        .select("profile_id, role, title, profiles!inner(full_name)")
        .eq("company_id", id)
        .order("role", { ascending: true }),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .eq("published_as", "company")
        .is("removed_at", null),
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
    postCount: postCount ?? 0,
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
