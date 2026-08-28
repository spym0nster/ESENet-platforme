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
    .select("id, status, message, created_at, student_id, profiles(full_name)")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  // One extra query for each applicant's headline / skills / CV, keyed by
  // student — avoids an N+1.
  const studentIds = [...new Set((applications ?? []).map((a) => a.student_id as string))];
  const detailsById = new Map<
    string,
    { headline: string | null; skills: string[]; cv_url: string | null }
  >();
  if (studentIds.length > 0) {
    const { data: details } = await supabase
      .from("student_details")
      .select("profile_id, headline, skills, cv_url")
      .in("profile_id", studentIds);
    for (const d of details ?? []) {
      detailsById.set(d.profile_id as string, {
        headline: d.headline,
        skills: d.skills ?? [],
        cv_url: d.cv_url,
      });
    }
  }

  // Batch-sign the CVs. A per-path error (no file, or RLS blocking a team
  // member pre-0018) just means no link renders for that applicant — the
  // rest of the row is unaffected.
  const cvUrlByStudent = new Map<string, string>();
  const cvPaths = studentIds
    .map((sid) => detailsById.get(sid)?.cv_url)
    .filter((p): p is string => Boolean(p));
  if (cvPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("cvs")
      .createSignedUrls(cvPaths, 60 * 10);
    for (const entry of signed ?? []) {
      if (entry.signedUrl && !entry.error && entry.path) {
        // map the path back to its student (path is `<student_id>/cv.pdf`)
        const sid = entry.path.split("/")[0];
        cvUrlByStudent.set(sid, entry.signedUrl);
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/company/dashboard" className="inline-block py-2 font-mono text-xs text-accent-2">
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
          {applications?.map((a) => {
            const sid = a.student_id as string;
            const d = detailsById.get(sid);
            const cvUrl = cvUrlByStudent.get(sid);
            return (
              <li key={a.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/students/${sid}`}
                        className="font-display font-bold hover:text-accent-2"
                      >
                        {(a.profiles as unknown as { full_name: string } | null)
                          ?.full_name ?? "ESEN student"}
                      </Link>
                      {d?.headline && (
                        <p className="text-sm text-text-muted">{d.headline}</p>
                      )}
                      <p className="mt-0.5 text-xs text-text-faint">
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

                  {d && d.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {d.skills.slice(0, 10).map((skill) => (
                        <span
                          key={skill}
                          className="rounded border border-border bg-surface-alt px-2 py-0.5 font-mono text-xs text-text-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {a.message && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-text-muted">
                      {a.message}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs">
                    <Link
                      href={`/students/${sid}`}
                      className="py-1 text-accent-2 hover:text-text"
                    >
                      Full profile →
                    </Link>
                    {cvUrl && (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 text-accent-2 hover:text-text"
                      >
                        View CV (PDF) →
                      </a>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
