import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ApplyForm } from "@/components/apply-form";
import { SaveOpportunityButton } from "@/components/save-opportunity-button";

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
      "id, type, title, description, skills, location, remote, start_date, end_date, company_id, companies(company_name, website, logo_url)"
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
  let isStudent = false;
  let isSaved = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStudent = profile?.role === "student";

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("opportunity_id", id)
      .eq("student_id", user.id)
      .maybeSingle();
    alreadyApplied = Boolean(existing);

    if (isStudent) {
      const { data: saved } = await supabase
        .from("saved_opportunities")
        .select("opportunity_id")
        .eq("student_id", user.id)
        .eq("opportunity_id", id)
        .maybeSingle();
      isSaved = Boolean(saved);
    }
  }

  const company = opportunity.companies as unknown as {
    company_name: string;
    website: string | null;
    logo_url: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded bg-accent2-soft px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-accent-2">
          {TYPE_LABEL[opportunity.type] ?? opportunity.type}
        </span>
        {isStudent && (
          <SaveOpportunityButton opportunityId={opportunity.id} initiallySaved={isSaved} />
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {company?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={company.logo_url}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <h1 className="font-display text-3xl font-extrabold">
          {opportunity.title}
        </h1>
      </div>
      <p className="mt-1 text-text-muted">
        <Link
          href={`/companies/${opportunity.company_id}`}
          className="text-accent-2 hover:text-text"
        >
          {company?.company_name ?? "ESEN partner company"}
        </Link>
        {opportunity.location ? ` · ${opportunity.location}` : ""}
        {opportunity.remote ? " · Remote" : ""}
        {company?.website && (
          <>
            {" · "}
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-accent-2 hover:text-text"
            >
              Website
            </a>
          </>
        )}
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
