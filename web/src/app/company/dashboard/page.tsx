import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Opportunity } from "@/types/database";
import { Card, Badge, EmptyState, LinkButton } from "@/components/ui";
import { OpportunityStatusButton } from "@/components/opportunity-status-button";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  published: "Published",
  closed: "Closed",
};

export const metadata = {
  title: "Your opportunities",
  robots: { index: false },
};

export default async function CompanyDashboardPage({
  searchParams,
}: PageProps<"/company/dashboard">) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { published, updated } = await searchParams;
  const { supabase, company, companyId } = await requireCompanyUser("/company/dashboard");

  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select("id, type, title, location, remote, status, created_at, application_deadline")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<
      Pick<
        Opportunity,
        | "id"
        | "type"
        | "title"
        | "location"
        | "remote"
        | "status"
        | "created_at"
        | "application_deadline"
      >[]
    >();

  // One extra query for applicant counts, keyed by opportunity — avoids an
  // N+1 by fetching all of this company's applications at once.
  const opportunityIds = opportunities?.map((o) => o.id) ?? [];
  const applicantCounts = new Map<string, number>();
  const newApplicantCounts = new Map<string, number>();
  if (opportunityIds.length > 0) {
    const { data: applicationRows } = await supabase
      .from("applications")
      .select("opportunity_id, status")
      .in("opportunity_id", opportunityIds);
    for (const row of applicationRows ?? []) {
      applicantCounts.set(row.opportunity_id, (applicantCounts.get(row.opportunity_id) ?? 0) + 1);
      // "New" = still at the default 'applied' status, i.e. the company
      // hasn't triaged it yet.
      if (row.status === "applied") {
        newApplicantCounts.set(
          row.opportunity_id,
          (newApplicantCounts.get(row.opportunity_id) ?? 0) + 1
        );
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
            {company?.company_name ?? "Company dashboard"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">
            Your opportunities
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/company/team" className="py-2 font-mono text-xs text-accent-2 hover:text-text">
            Team →
          </Link>
          <LinkButton href="/company/opportunities/new" variant="primary">
            + Post an Opportunity
          </LinkButton>
        </div>
      </div>

      {(published === "1" || updated === "1") && (
        <p
          className="mt-6 rounded-md px-4 py-3 text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
        >
          {published === "1"
            ? "Opportunity published successfully."
            : "Changes saved."}
        </p>
      )}

      {!company?.verified && (
        <p className="mt-6 rounded-md border border-border bg-surface-alt px-4 py-3 text-sm text-text-muted">
          Your company hasn&apos;t been verified by ESENet yet. Published
          opportunities are saved and will go live for students automatically
          as soon as verification is complete — no need to repost.
        </p>
      )}

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load your opportunities: {error.message}
        </p>
      )}

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          My opportunities
        </h2>

        {!error && (!opportunities || opportunities.length === 0) ? (
          <div className="mt-4">
            <EmptyState
              title="You haven't posted any opportunities yet."
              body="Create your first opportunity and connect with ESEN students."
              action={
                <LinkButton href="/company/opportunities/new" variant="primary">
                  + Post an Opportunity
                </LinkButton>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {opportunities?.map((o) => (
              <li key={o.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold">{o.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={o.status === "published" ? "info" : "neutral"}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                      {o.status === "published" && !company?.verified && (
                        <Badge variant="neutral">Hidden — pending verification</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {TYPE_LABEL[o.type] ?? o.type}
                    {o.location ? ` · ${o.location}` : ""}
                    {o.remote ? " · Remote" : ""}
                    {" · "}
                    {new Date(o.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {o.application_deadline && (
                    <p className="mt-0.5 font-mono text-xs text-text-faint">
                      {o.application_deadline <
                      new Date().toISOString().slice(0, 10)
                        ? "Applications closed "
                        : "Applications close "}
                      {new Date(o.application_deadline).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <Link
                      href={`/company/opportunities/${o.id}/applicants`}
                      className="flex items-center gap-2 py-2 font-mono text-xs text-accent-2 hover:text-text"
                    >
                      View applicants ({applicantCounts.get(o.id) ?? 0}) →
                      {(newApplicantCounts.get(o.id) ?? 0) > 0 && (
                        <Badge variant="info">
                          {newApplicantCounts.get(o.id)} new
                        </Badge>
                      )}
                    </Link>
                    <Link
                      href={`/company/opportunities/${o.id}/edit`}
                      className="py-2 font-mono text-xs text-text-muted hover:text-text"
                    >
                      Edit
                    </Link>
                    <OpportunityStatusButton opportunityId={o.id} status={o.status} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
