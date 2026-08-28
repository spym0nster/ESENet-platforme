import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { OpportunityForm } from "@/components/opportunity-form";

export default async function EditOpportunityPage({
  params,
}: PageProps<"/company/opportunities/[id]/edit">) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const { supabase, companyId } = await requireCompanyUser(
    `/company/opportunities/${id}/edit`
  );

  // Ownership-scoped fetch — never trust the route param alone; RLS backs
  // this up too.
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id, type, title, description, skills, location, remote, start_date, end_date, application_deadline"
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!opportunity) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/company/dashboard"
        className="inline-block py-2 font-mono text-xs text-accent-2 hover:text-text"
      >
        ← Back to dashboard
      </Link>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent-2">
        Edit opportunity
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        {opportunity.title}
      </h1>

      <div className="mt-10">
        <OpportunityForm
          opportunity={{
            id: opportunity.id,
            type: opportunity.type,
            title: opportunity.title,
            description: opportunity.description,
            skills: opportunity.skills ?? [],
            location: opportunity.location,
            remote: opportunity.remote,
            start_date: opportunity.start_date,
            end_date: opportunity.end_date,
            application_deadline: opportunity.application_deadline,
          }}
        />
      </div>
    </div>
  );
}
