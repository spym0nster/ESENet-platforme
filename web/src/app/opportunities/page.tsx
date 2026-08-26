import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

export default async function OpportunitiesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">
          Connect Supabase to see opportunities
        </h1>
        <p className="mt-3 text-text-muted">
          Add your project URL and anon key to{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">
            .env.local
          </code>{" "}
          (see{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">
            .env.local.example
          </code>
          ) and run{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">
            supabase/schema.sql
          </code>{" "}
          in the Supabase SQL editor.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select("id, type, title, description, skills, location, remote, companies(company_name)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Opportunities
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold">
        Internships &amp; PFE, published by real companies
      </h1>

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load opportunities: {error.message}
        </p>
      )}

      {!error && (!opportunities || opportunities.length === 0) && (
        <p className="mt-8 text-text-muted">
          No opportunities published yet. Once a company posts one, it shows
          up here.
        </p>
      )}

      <ul className="mt-8 space-y-4">
        {opportunities?.map((o) => (
          <li key={o.id}>
            <Link
              href={`/opportunities/${o.id}`}
              className="block rounded-lg border border-border bg-surface p-6 transition hover:border-accent-2/50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-accent2-soft px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-accent-2">
                  {TYPE_LABEL[o.type] ?? o.type}
                </span>
                {o.location && (
                  <span className="text-xs text-text-faint">{o.location}</span>
                )}
                {o.remote && (
                  <span className="text-xs text-text-faint">Remote</span>
                )}
              </div>
              <h2 className="mt-2 font-display text-lg font-bold">
                {o.title}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {(o.companies as unknown as { company_name: string } | null)
                  ?.company_name ?? "ESEN partner company"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
