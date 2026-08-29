import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Card, Badge, EmptyState, LinkButton } from "@/components/ui";
import { WithdrawApplicationButton } from "@/components/withdraw-application-button";
import type { ApplicationStatus } from "@/types/database";

const STUDENT_STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  reviewed: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

function badgeTone(status: ApplicationStatus): "violet" | "cyan" | "magenta" | "neutral" {
  if (status === "accepted") return "violet";
  if (status === "rejected" || status === "withdrawn") return "magenta";
  if (status === "shortlisted" || status === "interview") return "cyan";
  return "neutral";
}

export const metadata = {
  title: "My applications",
  robots: { index: false },
};

export default async function MyApplicationsPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/applications");
  }

  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      "id, status, created_at, opportunities(id, title, type, companies(company_name))"
    )
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        My applications
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Track your applications
      </h1>

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load your applications: {error.message}
        </p>
      )}

      {!error && (!applications || applications.length === 0) ? (
        <div className="mt-8">
          <EmptyState
            title="No applications yet"
            body="Browse opportunities and apply — everything you send lands here."
            action={
              <LinkButton href="/opportunities" variant="primary">
                Browse opportunities
              </LinkButton>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {applications?.map((a) => {
            const opportunity = a.opportunities as unknown as {
              id: string;
              title: string;
              type: string;
              companies: { company_name: string } | null;
            } | null;
            const status = a.status as ApplicationStatus;
            return (
              <li key={a.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/opportunities/${opportunity?.id}`}
                        className="inline-block py-1 font-display font-semibold hover:text-accent-2"
                      >
                        {opportunity?.title ?? "Opportunity"}
                      </Link>
                      <p className="text-sm text-text-muted">
                        {opportunity?.companies?.company_name ?? "ESEN partner company"}
                        {opportunity?.type ? ` · ${TYPE_LABEL[opportunity.type] ?? opportunity.type}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={badgeTone(status)}>
                        {STUDENT_STATUS_LABEL[status] ?? status}
                      </Badge>
                      {status !== "withdrawn" &&
                        status !== "accepted" &&
                        status !== "rejected" && (
                          <WithdrawApplicationButton applicationId={a.id} />
                        )}
                    </div>
                  </div>
                  <Link
                    href={`/applications/${a.id}`}
                    className="mt-3 inline-block font-mono text-xs text-accent-2 hover:text-text"
                  >
                    Details &amp; status history →
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
