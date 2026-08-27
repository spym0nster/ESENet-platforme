import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { OpportunityForm } from "@/components/opportunity-form";

export default async function NewOpportunityPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  await requireCompanyUser("/company/opportunities/new");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        New opportunity
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Post an Opportunity
      </h1>
      <p className="mt-2 text-text-muted">
        Create an opportunity and connect with ESEN talent.
      </p>

      <div className="mt-10">
        <OpportunityForm />
      </div>
    </div>
  );
}
