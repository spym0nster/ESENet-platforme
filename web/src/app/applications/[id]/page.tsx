import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Card, Badge } from "@/components/ui";
import { WithdrawApplicationButton } from "@/components/withdraw-application-button";
import type { ApplicationStatus } from "@/types/database";

const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  reviewed: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

function badgeVariant(
  status: ApplicationStatus
): "info" | "success" | "danger" | "neutral" {
  if (status === "accepted") return "success";
  if (status === "rejected" || status === "withdrawn") return "danger";
  if (status === "shortlisted" || status === "interview") return "info";
  return "neutral";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const OPEN_STATUSES: ApplicationStatus[] = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
];

export default async function ApplicationDetailPage({
  params,
}: PageProps<"/applications/[id]">) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/applications/${id}`);
  }

  const { data: application } = await supabase
    .from("applications")
    .select(
      "id, status, message, created_at, student_id, opportunities(id, title, type, location, remote, company_id, companies(company_name))"
    )
    .eq("id", id)
    .maybeSingle();

  // RLS already restricts the row to the owning student; this is defense in
  // depth and covers the not-found case in one branch.
  if (!application || application.student_id !== user.id) {
    notFound();
  }

  const opportunity = application.opportunities as unknown as {
    id: string;
    title: string;
    type: string;
    location: string | null;
    remote: boolean;
    company_id: string;
    companies: { company_name: string } | null;
  } | null;

  const { data: events } = await supabase
    .from("application_status_events")
    .select("id, status, changed_by, created_at")
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  // The initial application insert writes no status event, so seed the
  // timeline with a synthetic "Applied" entry from the application's own
  // created_at, then append the logged changes.
  const timeline: {
    key: string;
    status: ApplicationStatus;
    at: string;
    byYou: boolean;
  }[] = [
    {
      key: "applied",
      status: "applied",
      at: application.created_at,
      byYou: true,
    },
    ...(events ?? []).map((e) => ({
      key: e.id,
      status: e.status as ApplicationStatus,
      at: e.created_at,
      byYou: e.changed_by === user.id,
    })),
  ];

  const status = application.status as ApplicationStatus;
  const canWithdraw = OPEN_STATUSES.includes(status);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/applications"
        className="font-mono text-xs text-accent-2 hover:text-text"
      >
        ← All applications
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {opportunity ? (
              <Link
                href={`/opportunities/${opportunity.id}`}
                className="hover:text-accent-2"
              >
                {opportunity.title}
              </Link>
            ) : (
              "Opportunity"
            )}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {opportunity?.company_id ? (
              <Link
                href={`/companies/${opportunity.company_id}`}
                className="text-accent-2 hover:text-text"
              >
                {opportunity.companies?.company_name ?? "ESEN partner company"}
              </Link>
            ) : (
              (opportunity?.companies?.company_name ?? "ESEN partner company")
            )}
            {opportunity?.type
              ? ` · ${TYPE_LABEL[opportunity.type] ?? opportunity.type}`
              : ""}
            {opportunity?.location ? ` · ${opportunity.location}` : ""}
            {opportunity?.remote ? " · Remote" : ""}
          </p>
        </div>
        <Badge variant={badgeVariant(status)}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <Card className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-text-faint">
          Status history
        </h2>
        <ol className="mt-4 space-y-4">
          {timeline.map((entry) => (
            <li key={entry.key} className="flex gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-2" />
              <div>
                <p className="text-sm font-semibold text-text">
                  {STATUS_LABEL[entry.status] ?? entry.status}
                </p>
                <p className="font-mono text-xs text-text-faint">
                  {formatDate(entry.at)} ·{" "}
                  {entry.byYou ? "by you" : "by the company"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {application.message && (
        <Card className="mt-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-text-faint">
            Your cover message
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-text">
            {application.message}
          </p>
        </Card>
      )}

      {canWithdraw && (
        <div className="mt-6">
          <WithdrawApplicationButton applicationId={application.id} />
        </div>
      )}
    </div>
  );
}
