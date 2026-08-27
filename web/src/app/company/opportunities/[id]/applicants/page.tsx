import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Card, EmptyState } from "@/components/ui";
import { ApplicationStatusForm } from "@/components/application-status-form";
import type { ApplicationStatus } from "@/types/database";

export default async function OpportunityApplicantsPage({
  params,
}: PageProps<"/company/opportunities/[id]/applicants">) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const { supabase, companyId } = await requireCompanyUser(
    `/company/opportunities/${id}/applicants`
  );

  // Ownership check: this opportunity must belong to the company this user
  // acts for (owner or team member) — never trust the route param alone,
  // RLS backs this up too.
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, title")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!opportunity) {
    notFound();
  }

  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, status, message, created_at, profiles(full_name)")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/company/dashboard" className="font-mono text-xs text-accent-2">
        ← Back to dashboard
      </Link>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent-2">
        Applicants
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        {opportunity.title}
      </h1>

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load applicants: {error.message}
        </p>
      )}

      {!error && (!applications || applications.length === 0) ? (
        <div className="mt-8">
          <EmptyState
            title="No applicants yet."
            body="Once a student applies, they'll show up here."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {applications?.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">
                      {(a.profiles as unknown as { full_name: string } | null)
                        ?.full_name ?? "ESEN student"}
                    </p>
                    <p className="text-xs text-text-faint">
                      Applied{" "}
                      {new Date(a.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ApplicationStatusForm
                    applicationId={a.id}
                    opportunityId={id}
                    currentStatus={a.status as ApplicationStatus}
                  />
                </div>
                {a.message && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-text-muted">
                    {a.message}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
