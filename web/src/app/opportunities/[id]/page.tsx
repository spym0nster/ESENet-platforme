import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ApplyForm } from "@/components/apply-form";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

export default async function OpportunityPage({
  params,
}: PageProps<"/opportunities/[id]">) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id, type, title, description, skills, location, remote, start_date, end_date, companies(company_name, website)"
    )
    .eq("id", id)
    .single();

  if (!opportunity) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyApplied = false;
  if (user) {
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("opportunity_id", id)
      .eq("student_id", user.id)
      .maybeSingle();
    alreadyApplied = Boolean(existing);
  }

  const company = opportunity.companies as unknown as {
    company_name: string;
    website: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <span className="rounded bg-accent2-soft px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-accent-2">
        {TYPE_LABEL[opportunity.type] ?? opportunity.type}
      </span>
      <h1 className="mt-3 font-display text-3xl font-extrabold">
        {opportunity.title}
      </h1>
      <p className="mt-1 text-text-muted">
        {company?.company_name ?? "ESEN partner company"}
        {opportunity.location ? ` · ${opportunity.location}` : ""}
        {opportunity.remote ? " · Remote" : ""}
      </p>

      <p className="mt-8 whitespace-pre-wrap text-text">
        {opportunity.description}
      </p>

      {opportunity.skills?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {opportunity.skills.map((skill: string) => (
            <span
              key={skill}
              className="rounded border border-border bg-surface-alt px-2.5 py-1 font-mono text-xs text-text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-8">
        <ApplyForm opportunityId={opportunity.id} alreadyApplied={alreadyApplied} />
      </div>
    </div>
  );
}
