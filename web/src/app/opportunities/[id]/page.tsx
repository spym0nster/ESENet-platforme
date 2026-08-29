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
import { Badge, Card, Chip, CompanyLogo, MatchArc } from "@/components/ui";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

const TYPE_TONE: Record<string, "neutral" | "cyan" | "violet" | "magenta"> = {
  internship: "cyan",
  alternance: "cyan",
  pfe: "violet",
  job: "magenta",
  freelance: "neutral",
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
    data.applicantLocationRequirements = { "@type": "Country", name: "Tunisia" };
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

function fmtDate(iso: string | null): string | null {
  return iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
}

/** case-insensitive overlap */
function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => set.has(s.toLowerCase()));
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
        {label}
      </p>
      <p className="mt-1 font-display text-sm font-medium">{children}</p>
    </div>
  );
}

export default async function OpportunityPage({
  params,
}: PageProps<"/opportunities/[id]">) {
  const { id } = await params;

  if (!isSupabaseConfigured()) notFound();

  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id, type, title, description, skills, location, remote, start_date, end_date, application_deadline, status, created_at, company_id, companies(company_name, website, logo_url)"
    )
    .eq("id", id)
    .single();

  if (!opportunity) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyApplied = false;
  let isStudent = false;
  let isSaved = false;
  let studentSkills: string[] = [];
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
      const { data: details } = await supabase
        .from("student_details")
        .select("skills")
        .eq("profile_id", user.id)
        .maybeSingle();
      studentSkills = details?.skills ?? [];

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
  const companyName = company?.company_name ?? "ESEN partner company";

  const todayIso = new Date().toISOString().slice(0, 10);
  const deadlinePassed =
    Boolean(opportunity.application_deadline) &&
    opportunity.application_deadline! < todayIso;
  const applicationsClosed =
    opportunity.status !== "published" || deadlinePassed;

  const oppSkills = (opportunity.skills as string[] | null) ?? [];
  const showArc = isStudent && studentSkills.length >= 3 && oppSkills.length > 0;
  const matched = showArc ? overlap(oppSkills, studentSkills) : [];
  const matchedSet = new Set(matched.map((s) => s.toLowerCase()));

  const similar =
    opportunity.status === "published"
      ? await fetchSimilarOpportunities(supabase, {
          opportunityId: opportunity.id,
          skills: oppSkills,
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
          companyName,
          companyWebsite: company?.website ?? null,
        })
      : null;

  const durationLabel =
    opportunity.start_date && opportunity.end_date
      ? monthsBetween(opportunity.start_date, opportunity.end_date)
      : null;
  const deadlineLabel = fmtDate(opportunity.application_deadline);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <Link
        href="/opportunities"
        className="font-mono text-[11px] uppercase tracking-widest text-accent-2 hover:text-text"
      >
        ← All opportunities
      </Link>

      <Card className="mt-4 p-6">
        <div className="flex gap-4">
          <CompanyLogo name={companyName} src={company?.logo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/companies/${opportunity.company_id}`}
              className="text-sm font-semibold text-accent-2 hover:text-text"
            >
              {companyName}
            </Link>
            <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-tight">
              {opportunity.title}
            </h1>
          </div>
          {showArc && (
            <MatchArc matched={matched.length} required={oppSkills.length} />
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
          <Fact label="Type">
            {TYPE_LABEL[opportunity.type] ?? opportunity.type}
            {durationLabel ? ` · ${durationLabel}` : ""}
          </Fact>
          <Fact label="Location">
            {opportunity.location ?? (opportunity.remote ? "Remote" : "—")}
          </Fact>
          <Fact label="Starts">{fmtDate(opportunity.start_date) ?? "—"}</Fact>
          <Fact label="Closes">
            {deadlineLabel ? (
              <span className={deadlinePassed ? "text-text-faint" : "text-magenta-on-soft"}>
                {deadlineLabel}
              </span>
            ) : (
              "No deadline"
            )}
          </Fact>
        </div>

        <div className="mt-6">
          {alreadyApplied || !applicationsClosed ? (
            <ApplyForm
              opportunityId={opportunity.id}
              alreadyApplied={alreadyApplied}
              saveButton={
                isStudent && !alreadyApplied ? (
                  <SaveOpportunityButton
                    opportunityId={opportunity.id}
                    initiallySaved={isSaved}
                  />
                ) : undefined
              }
            />
          ) : (
            <p className="rounded-ctrl border border-border bg-surface-alt px-4 py-3 text-sm text-text-muted">
              {deadlinePassed
                ? "The application deadline for this opportunity has passed."
                : "This opportunity isn't accepting applications right now."}
            </p>
          )}
        </div>
      </Card>

      <div className="mt-8 whitespace-pre-wrap leading-relaxed text-text">
        {opportunity.description}
      </div>

      {oppSkills.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {oppSkills.map((s) => (
            <Chip key={s} match={matchedSet.has(s.toLowerCase())}>
              {s}
            </Chip>
          ))}
        </div>
      )}

      {similar.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-faint">
            Similar opportunities
          </p>
          <ul className="mt-4 space-y-2">
            {similar.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunities/${o.id}`}
                  className="flex flex-wrap items-baseline gap-x-2 rounded-ctrl px-3 py-2 hover:bg-surface"
                >
                  <Badge tone={TYPE_TONE[o.type] ?? "neutral"}>
                    {TYPE_LABEL[o.type] ?? o.type}
                  </Badge>
                  <span className="font-display text-sm font-semibold">{o.title}</span>
                  <span className="text-sm text-text-muted">{o.company_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <ShareButton path={`/opportunities/${opportunity.id}`} />
      </div>
    </div>
  );
}

function monthsBetween(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = Math.max(
    1,
    Math.round((e.getTime() - s.getTime()) / (30.4 * 864e5))
  );
  return `${months} month${months === 1 ? "" : "s"}`;
}
