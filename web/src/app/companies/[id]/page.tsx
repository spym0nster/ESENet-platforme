import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Badge, EmptyState } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { fetchCompanyProfile } from "@/lib/companies";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

export async function generateMetadata({
  params,
}: PageProps<"/companies/[id]">): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { id } = await params;
  const { data } = await createPublicClient()
    .from("companies")
    .select("company_name, description")
    .eq("profile_id", id)
    .maybeSingle();

  if (!data) return { title: "Company" };
  const description =
    (data.description as string | null)?.slice(0, 200) ??
    `${data.company_name} on ESENet — opportunities and team.`;

  return {
    title: data.company_name as string,
    description,
    openGraph: { title: data.company_name as string, description },
  };
}

export default async function CompanyProfilePage({
  params,
}: PageProps<"/companies/[id]">) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const supabase = await createClient();
  const data = await fetchCompanyProfile(supabase, id);
  if (!data) notFound();

  const { company, opportunities, team } = data;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/opportunities"
        className="inline-block py-2 font-mono text-xs text-accent-2 hover:text-text"
      >
        ← All opportunities
      </Link>

      {company.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img
          src={company.banner_url}
          alt=""
          className="mt-4 h-40 w-full rounded-lg object-cover"
        />
      )}

      <div className="mt-6 flex items-start gap-4">
        {company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={company.logo_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-alt font-display text-2xl font-bold text-text-faint">
            {company.company_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold">
              {company.company_name}
            </h1>
            {company.verified ? (
              <Badge variant="info">Verified</Badge>
            ) : (
              <Badge variant="neutral">Not yet verified</Badge>
            )}
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block py-1 font-mono text-xs text-accent-2 hover:text-text"
            >
              {company.website.replace(/^https?:\/\//, "")} →
            </a>
          )}
          <div className="mt-2">
            <ShareButton path={`/companies/${company.id}`} label="Share profile" />
          </div>
        </div>
      </div>

      {company.description && (
        <p className="mt-8 whitespace-pre-wrap text-text">{company.description}</p>
      )}

      <Section title="Open opportunities">
        {opportunities.length === 0 ? (
          <EmptyState
            title={
              company.verified
                ? "No open opportunities right now"
                : "Nothing published yet"
            }
            body={
              company.verified
                ? "Check back later, or browse other companies."
                : "This company's opportunities go live once ESENet verifies it."
            }
          />
        ) : (
          <ul className="space-y-3">
            {opportunities.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunities/${o.id}`}
                  className="block rounded-lg border border-border bg-surface p-4 transition hover:border-accent-2/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{TYPE_LABEL[o.type] ?? o.type}</Badge>
                    {o.location && (
                      <span className="text-xs text-text-faint">{o.location}</span>
                    )}
                    {o.remote && (
                      <span className="text-xs text-text-faint">Remote</span>
                    )}
                  </div>
                  <p className="mt-2 font-display font-bold">{o.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {team.length > 0 && (
        <Section title="Team on ESENet">
          <ul className="space-y-2">
            {team.map((m) => (
              <li key={m.profile_id} className="text-sm">
                <span className="font-semibold text-text">{m.full_name}</span>
                {m.title && (
                  <span className="text-text-muted"> · {m.title}</span>
                )}
                {m.role === "owner" && (
                  <span className="ml-2 font-mono text-xs text-text-faint">
                    owner
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
