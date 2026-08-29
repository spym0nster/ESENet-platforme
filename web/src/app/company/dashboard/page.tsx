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

// Posting status is a low-stakes glance — one hue, three opacities (§4),
// never a colour.
const STATUS_OPACITY: Record<string, string> = {
  published: "",
  pending: "opacity-70",
  closed: "opacity-50",
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

  const opps = opportunities ?? [];
  const totalApplicants = [...applicantCounts.values()].reduce((a, b) => a + b, 0);
  const totalNew = [...newApplicantCounts.values()].reduce((a, b) => a + b, 0);
  const stats = [
    { label: "Published", value: opps.filter((o) => o.status === "published").length },
    { label: "Pending", value: opps.filter((o) => o.status === "pending").length },
    { label: "Applicants", value: totalApplicants },
    { label: "Awaiting review", value: totalNew },
  ];
  const today = new Date().toISOString().slice(0, 10);

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
            Post an opportunity
          </LinkButton>
        </div>
      </div>

      {(published === "1" || updated === "1") && (
        <p className="mt-6 rounded-ctrl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-on-soft">
          {published === "1" ? "Opportunity published." : "Changes saved."}
        </p>
      )}

      {!company?.verified && (
        <p className="mt-6 rounded-ctrl border border-border bg-surface-alt px-4 py-3 text-sm text-text-muted">
          ESENet hasn&apos;t verified your company yet. Published opportunities
          are saved and go live for students automatically once verification
          completes — no need to repost.
        </p>
      )}

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load your opportunities: {error.message}
        </p>
      )}

      {!error && opps.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-4 py-3">
              <dd className="font-display text-2xl font-extrabold tabular-nums">
                {s.value}
              </dd>
              <dt className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-text-faint">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Postings</h2>

        {!error && opps.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No opportunities yet"
              body="Post your first opportunity and start meeting ESEN students."
              action={
                <LinkButton href="/company/opportunities/new" variant="primary">
                  Post an opportunity
                </LinkButton>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {opps.map((o) => {
              const count = applicantCounts.get(o.id) ?? 0;
              const fresh = newApplicantCounts.get(o.id) ?? 0;
              const past =
                o.application_deadline && o.application_deadline < today;
              return (
                <li key={o.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold leading-snug">
                          {o.title}
                        </h3>
                        <p className="mt-1 font-mono text-xs text-text-faint">
                          {TYPE_LABEL[o.type] ?? o.type}
                          {o.location ? ` · ${o.location}` : ""}
                          {o.remote ? " · Remote" : ""}
                          {" · posted "}
                          {new Date(o.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        {o.application_deadline && (
                          <p className="mt-0.5 font-mono text-xs text-text-faint">
                            {past ? "Applications closed " : "Applications close "}
                            {new Date(o.application_deadline).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge
                          tone="neutral"
                          className={STATUS_OPACITY[o.status] ?? ""}
                        >
                          {STATUS_LABEL[o.status] ?? o.status}
                        </Badge>
                        {o.status === "published" && !company?.verified && (
                          <Badge tone="neutral" className="opacity-70">
                            Hidden — pending verification
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
                      <LinkButton
                        href={`/company/opportunities/${o.id}/applicants`}
                        variant="secondary"
                        size="compact"
                      >
                        View applicants · {count}
                      </LinkButton>
                      {fresh > 0 && <Badge tone="cyan">{fresh} new</Badge>}
                      <span className="ml-auto flex items-center gap-4">
                        <Link
                          href={`/company/opportunities/${o.id}/edit`}
                          className="font-mono text-xs text-text-faint hover:text-text"
                        >
                          Edit
                        </Link>
                        <OpportunityStatusButton
                          opportunityId={o.id}
                          status={o.status}
                        />
                      </span>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
