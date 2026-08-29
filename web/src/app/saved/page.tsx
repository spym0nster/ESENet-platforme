import { notFound } from "next/navigation";
import { requireStudentUser } from "@/lib/auth/require-student";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EmptyState, LinkButton } from "@/components/ui";
import { OpportunityCard } from "@/components/opportunity-card";

export const metadata = {
  title: "Saved opportunities",
  robots: { index: false },
};

type SavedRow = {
  id: string;
  title: string;
  type: string;
  skills: string[] | null;
  location: string | null;
  remote: boolean;
  application_deadline: string | null;
  companies: { company_name: string; logo_url: string | null } | null;
};

export default async function SavedOpportunitiesPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase, user } = await requireStudentUser("/saved");

  const [{ data: saved, error }, { data: details }] = await Promise.all([
    supabase
      .from("saved_opportunities")
      .select(
        "opportunity_id, opportunities(id, title, type, skills, location, remote, application_deadline, companies(company_name, logo_url))"
      )
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_details")
      .select("skills")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const studentSkills = (details?.skills as string[] | null) ?? [];
  const showArc = studentSkills.length >= 3;

  // RLS silently omits the embedded opportunity if it's no longer publicly
  // visible (closed, or unverified) — drop those rows.
  const rows = (saved ?? [])
    .map((r) => r.opportunities as unknown as SavedRow | null)
    .filter((o): o is SavedRow => Boolean(o));

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

      {!error && rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet"
            body="Save opportunities while browsing and they land here for later."
            action={
              <LinkButton href="/opportunities" variant="primary">
                Browse opportunities
              </LinkButton>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((o) => (
            <li key={o.id}>
              <OpportunityCard
                opportunity={{
                  id: o.id,
                  type: o.type,
                  title: o.title,
                  skills: o.skills,
                  location: o.location,
                  remote: o.remote,
                  application_deadline: o.application_deadline,
                  company: {
                    name: o.companies?.company_name ?? "ESEN partner company",
                    logo_url: o.companies?.logo_url ?? null,
                  },
                }}
                viewerSkills={studentSkills}
                showArc={showArc}
                saved
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
