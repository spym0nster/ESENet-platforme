import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudentUser } from "@/lib/auth/require-student";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Badge, EmptyState } from "@/components/ui";
import { SaveOpportunityButton } from "@/components/save-opportunity-button";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

export const metadata = {
  title: "Saved opportunities",
  robots: { index: false },
};

export default async function SavedOpportunitiesPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase, user } = await requireStudentUser("/saved");

  const { data: saved, error } = await supabase
    .from("saved_opportunities")
    .select(
      "opportunity_id, opportunities(id, title, type, location, remote, companies(company_name))"
    )
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Saved
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Saved opportunities
      </h1>

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load your saved opportunities: {error.message}
        </p>
      )}

      {!error && (!saved || saved.length === 0) ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet."
            body="Save opportunities while browsing to come back to them later."
            action={
              <Link href="/opportunities" className="inline-block py-2 font-mono text-sm text-accent-2">
                Browse opportunities →
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {saved?.map((row) => {
            // RLS silently omits the embedded opportunity if it's no longer
            // publicly visible (closed, or unverified) — skip those rows.
            const o = row.opportunities as unknown as {
              id: string;
              title: string;
              type: string;
              location: string | null;
              remote: boolean;
              companies: { company_name: string } | null;
            } | null;
            if (!o) return null;
            return (
              <li key={row.opportunity_id}>
                <div className="rounded-lg border border-border bg-surface p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{TYPE_LABEL[o.type] ?? o.type}</Badge>
                      {o.location && (
                        <span className="text-xs text-text-faint">{o.location}</span>
                      )}
                    </div>
                    <SaveOpportunityButton opportunityId={o.id} initiallySaved={true} />
                  </div>
                  <Link href={`/opportunities/${o.id}`} className="mt-2 block">
                    <h2 className="font-display text-lg font-bold">{o.title}</h2>
                    <p className="mt-1 text-sm text-text-muted">
                      {o.companies?.company_name ?? "ESEN partner company"}
                    </p>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
