import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ApplyForm } from "@/components/apply-form";
import { SaveOpportunityButton } from "@/components/save-opportunity-button";
import { ShareButton } from "@/components/share-button";
import { fetchSimilarOpportunities } from "@/lib/opportunities";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

// schema.org JobPosting employmentType values
const EMPLOYMENT_TYPE: Record<string, string> = {
  internship: "INTERN",
  pfe: "INTERN",
  job: "FULL_TIME",
  alternance: "OTHER",
  freelance: "CONTRACTOR",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esenet-platforme.vercel.app";

/**
 * Google-for-Jobs JobPosting structured data. Only emitted for a published
 * opportunity. `directApply` is true — applying happens on this page.
 */
function jobPostingJsonLd(o: {
  id: string;
  type: string;
  title: string;
  description: string;
  location: string | null;
  remote: boolean;
  application_deadline: string | null;
  created_at: string;
  companyName: string;
  companyWebsite: string | null;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: o.title,
    description: o.description,
    datePosted: o.created_at,
    employmentType: EMPLOYMENT_TYPE[o.type] ?? "OTHER",
    directApply: true,
    url: `${siteUrl}/opportunities/${o.id}`,
    hiringOrganization: {
      "@type": "Organization",
      name: o.companyName,
      ...(o.companyWebsite ? { sameAs: o.companyWebsite } : {}),
    },
  };

  if (o.application_deadline) data.validThrough = o.application_deadline;

  if (o.location) {
    data.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: o.location,
        addressCountry: "TN",
      },
    };
  }
  if (o.remote) {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = {
      "@type": "Country",
      name: "Tunisia",
    };
  }

  return data;
}

export async function generateMetadata({
  params,
}: PageProps<"/opportunities/[id]">): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { id } = await params;
  const { data } = await createPublicClient()
    .from("opportunities")
    .select("title, description, status, type, companies(company_name)")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.status !== "published") return { title: "Opportunity" };

  const company =
    (data.companies as unknown as { company_name: string } | null)
      ?.company_name ?? "an ESEN partner company";
  const label = TYPE_LABEL[data.type as string] ?? "Opportunity";
  const description = (data.description as string).slice(0, 200);

  return {
    title: `${data.title} — ${company}`,
    description,
    openGraph: {
      title: `${data.title} · ${label} at ${company}`,
      description,
      type: "article",
    },
  };
}

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
      "id, type, title, description, skills, location, remote, start_date, end_date, application_deadline, status, created_at, company_id, companies(company_name, website, logo_url)"
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

  const todayIso = new Date().toISOString().slice(0, 10);
  const deadlinePassed =
    Boolean(opportunity.application_deadline) &&
    opportunity.application_deadline! < todayIso;
  const applicationsClosed = opportunity.status !== "published" || deadlinePassed;

  const similar =
    opportunity.status === "published"
      ? await fetchSimilarOpportunities(supabase, {
          opportunityId: opportunity.id,
          skills: opportunity.skills ?? [],
        })
      : [];

  const jsonLd =
    opportunity.status === "published"
      ? jobPostingJsonLd({
          id: opportunity.id,
          type: opportunity.type,
          title: opportunity.title,
          description: opportunity.description,
          location: opportunity.location,
          remote: opportunity.remote,
          application_deadline: opportunity.application_deadline,
          created_at: opportunity.created_at,
          companyName: company?.company_name ?? "ESEN partner company",
          companyWebsite: company?.website ?? null,
        })
      : null;
  const dateLabel = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
  const deadlineLabel = dateLabel(opportunity.application_deadline);
  const startLabel = dateLabel(opportunity.start_date);
  const endLabel = dateLabel(opportunity.end_date);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {jsonLd && (
        <script
          type="application/ld+json"
          // Company-authored fields (title/description) can contain "<" — escape
          // it so a literal "</script>" in the text can't break out of the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <div className="flex items-center justify-between gap-4">
        <span className="rounded bg-accent2-soft px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-accent-2">
          {TYPE_LABEL[opportunity.type] ?? opportunity.type}
        </span>
        <div className="flex items-center gap-4">
          <ShareButton path={`/opportunities/${opportunity.id}`} />
          {isStudent && (
            <SaveOpportunityButton
              opportunityId={opportunity.id}
              initiallySaved={isSaved}
            />
          )}
        </div>
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

      {(startLabel || endLabel) && (
        <p className="mt-4 font-mono text-xs text-text-muted">
          {startLabel && endLabel
            ? `${startLabel} → ${endLabel}`
            : startLabel
              ? `Starts ${startLabel}`
              : `Until ${endLabel}`}
        </p>
      )}

      {deadlineLabel && (
        <p
          className={`mt-2 font-mono text-xs ${
            deadlinePassed ? "text-text-faint" : "text-accent-2"
          }`}
        >
          {deadlinePassed
            ? `Applications closed on ${deadlineLabel}`
            : `Apply by ${deadlineLabel}`}
        </p>
      )}

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
        {alreadyApplied || !applicationsClosed ? (
          <ApplyForm
            opportunityId={opportunity.id}
            alreadyApplied={alreadyApplied}
          />
        ) : (
          <p className="rounded-md border border-border bg-surface-alt px-4 py-3 text-sm text-text-muted">
            {deadlinePassed
              ? "The application deadline for this opportunity has passed."
              : "This opportunity isn't accepting applications right now."}
          </p>
        )}
      </div>

      {similar.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
            Similar opportunities
          </h2>
          <ul className="mt-4 space-y-2">
            {similar.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunities/${o.id}`}
                  className="flex flex-wrap items-baseline gap-x-2 rounded-md px-3 py-2 hover:bg-surface-alt"
                >
                  <span className="font-mono text-[11px] uppercase tracking-wide text-accent-2">
                    {TYPE_LABEL[o.type] ?? o.type}
                  </span>
                  <span className="font-display text-sm font-bold">{o.title}</span>
                  <span className="text-sm text-text-muted">{o.company_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
