import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpportunityType } from "@/types/database";

export type RecommendedOpportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  company_name: string;
  location: string | null;
  remote: boolean;
  matchCount: number;
  matchedSkills: string[];
};

/**
 * Skill-overlap recommendations for a student — the deliberately simple
 * "tag-overlap filter" the roadmap calls for pre-launch (a real scored
 * matching engine is explicitly deferred). Pulls published opportunities
 * that share at least one skill with the student, then ranks them by how
 * many skills overlap. Case-insensitive on the student's side; the DB
 * `overlaps` is exact, so we widen the query with a lowercased copy of the
 * skill list and dedupe.
 */
export async function fetchRecommendedOpportunities(
  supabase: SupabaseClient,
  studentSkills: string[],
  opts: { limit?: number; excludeIds?: string[] } = {}
): Promise<RecommendedOpportunity[]> {
  const skills = [...new Set(studentSkills.map((s) => s.trim()).filter(Boolean))];
  if (skills.length === 0) return [];

  const limit = opts.limit ?? 5;
  const wanted = new Set(skills.map((s) => s.toLowerCase()));

  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, type, title, skills, location, remote, application_deadline, companies!inner(company_name)"
    )
    .eq("status", "published")
    .overlaps("skills", skills)
    .limit(50);

  if (error) {
    console.error("fetchRecommendedOpportunities failed:", error);
    return [];
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const exclude = new Set(opts.excludeIds ?? []);

  return (data ?? [])
    .filter((o) => !exclude.has(o.id as string))
    .filter(
      (o) =>
        !o.application_deadline ||
        (o.application_deadline as string) >= todayIso
    )
    .map((o) => {
      const matched = ((o.skills as string[] | null) ?? []).filter((s) =>
        wanted.has(s.toLowerCase())
      );
      return {
        id: o.id as string,
        type: o.type as OpportunityType,
        title: o.title as string,
        company_name:
          (o.companies as unknown as { company_name: string } | null)
            ?.company_name ?? "ESEN partner company",
        location: (o.location as string | null) ?? null,
        remote: Boolean(o.remote),
        matchCount: matched.length,
        matchedSkills: matched,
      };
    })
    .filter((o) => o.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit);
}

export type SimilarOpportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  company_name: string;
};

/**
 * "More like this" for an opportunity detail page — other published
 * opportunities that share a skill with the given one, ranked by overlap,
 * excluding itself. Same deliberately-simple tag-overlap approach as the
 * student recommendations; no personalisation, so it's safe to render for
 * anonymous visitors.
 */
export async function fetchSimilarOpportunities(
  supabase: SupabaseClient,
  opts: { opportunityId: string; skills: string[]; limit?: number }
): Promise<SimilarOpportunity[]> {
  const skills = [...new Set(opts.skills.map((s) => s.trim()).filter(Boolean))];
  if (skills.length === 0) return [];

  const wanted = new Set(skills.map((s) => s.toLowerCase()));
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, type, title, skills, application_deadline, companies!inner(company_name)"
    )
    .eq("status", "published")
    .overlaps("skills", skills)
    .neq("id", opts.opportunityId)
    .limit(30);

  if (error) {
    console.error("fetchSimilarOpportunities failed:", error);
    return [];
  }

  const ranked = (data ?? [])
    .filter(
      (o) =>
        !o.application_deadline ||
        (o.application_deadline as string) >= todayIso
    )
    .map((o) => ({
      row: o,
      overlap: ((o.skills as string[] | null) ?? []).filter((s) =>
        wanted.has(s.toLowerCase())
      ).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, opts.limit ?? 3);

  return ranked.map(({ row }) => ({
    id: row.id as string,
    type: row.type as OpportunityType,
    title: row.title as string,
    company_name:
      (row.companies as unknown as { company_name: string } | null)
        ?.company_name ?? "ESEN partner company",
  }));
}
