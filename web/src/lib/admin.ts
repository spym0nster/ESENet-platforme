import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminStats = {
  students: number;
  companies: number;
  companiesVerified: number;
  companiesPending: number;
  opportunities: number;
  opportunitiesPublished: number;
  opportunitiesPending: number;
  opportunitiesClosed: number;
  applications: number;
  applicationsByStatus: Record<string, number>;
  openReports: number;
  posts: number;
  signupsLast7: number;
  signupsLast30: number;
  deactivated: number;
};

const daysAgoIso = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * All the numbers on /admin, in a fixed set of parallel count queries
 * (HEAD + exact count, no row payloads). Needs the admin read policies from
 * migration 0016 for the opportunity/application counts; without it those
 * tiles read 0 instead of throwing.
 */
export async function fetchAdminStats(
  supabase: SupabaseClient
): Promise<AdminStats> {
  const c = (q: PromiseLike<{ count: number | null }>) =>
    Promise.resolve(q).then((r) => r.count ?? 0);

  const [
    students,
    companies,
    companiesVerified,
    opportunities,
    opportunitiesPublished,
    opportunitiesPending,
    opportunitiesClosed,
    applications,
    openReports,
    posts,
    signupsLast7,
    signupsLast30,
    deactivated,
    appStatusRows,
  ] = await Promise.all([
    c(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student")),
    c(supabase.from("companies").select("profile_id", { count: "exact", head: true })),
    c(supabase.from("companies").select("profile_id", { count: "exact", head: true }).eq("verified", true)),
    c(supabase.from("opportunities").select("id", { count: "exact", head: true })),
    c(supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "published")),
    c(supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "closed")),
    c(supabase.from("applications").select("id", { count: "exact", head: true })),
    c(supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open")),
    c(supabase.from("posts").select("id", { count: "exact", head: true }).is("removed_at", null)),
    c(supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgoIso(7))),
    c(supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgoIso(30))),
    c(supabase.from("profiles").select("id", { count: "exact", head: true }).not("deactivated_at", "is", null)),
    supabase.from("applications").select("status").limit(5000),
  ]);

  const applicationsByStatus: Record<string, number> = {};
  for (const row of (appStatusRows.data ?? []) as { status: string }[]) {
    applicationsByStatus[row.status] = (applicationsByStatus[row.status] ?? 0) + 1;
  }

  return {
    students,
    companies,
    companiesVerified,
    companiesPending: Math.max(0, companies - companiesVerified),
    opportunities,
    opportunitiesPublished,
    opportunitiesPending,
    opportunitiesClosed,
    applications,
    applicationsByStatus,
    openReports,
    posts,
    signupsLast7,
    signupsLast30,
    deactivated,
  };
}
