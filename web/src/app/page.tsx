import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Badge, Card } from "@/components/ui";

const TYPE_TONE: Record<string, "neutral" | "cyan" | "violet" | "magenta"> = {
  internship: "cyan",
  alternance: "cyan",
  pfe: "violet",
  job: "magenta",
  freelance: "neutral",
};

// All reads here run as `anon` via a cookie-less client. The route is still
// rendered per-request today (the shared <SiteHeader> in the root layout
// reads auth cookies), but this page adds no auth dependency of its own.

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esenet-platforme.vercel.app";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

type LatestOpportunity = {
  id: string;
  type: string;
  title: string;
  company_name: string;
};

async function getHomeData(): Promise<{
  openRoles: number | null;
  companies: number | null;
  latest: LatestOpportunity[];
}> {
  if (!isSupabaseConfigured()) {
    return { openRoles: null, companies: null, latest: [] };
  }
  const supabase = createPublicClient();

  const [openRolesRes, companiesRes, latestRes] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("companies")
      .select("profile_id", { count: "exact", head: true })
      .eq("verified", true),
    supabase
      .from("opportunities")
      .select("id, type, title, companies!inner(company_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  return {
    openRoles: openRolesRes.count ?? null,
    companies: companiesRes.count ?? null,
    latest: (latestRes.data ?? []).map((o) => ({
      id: o.id as string,
      type: o.type as string,
      title: o.title as string,
      company_name:
        (o.companies as unknown as { company_name: string } | null)
          ?.company_name ?? "ESEN partner company",
    })),
  };
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ESENet",
  description:
    "ESENet — the year-round talent network connecting ESEN students, alumni, companies and startups.",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "École Supérieure de l'Économie Numérique (ESEN)",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Manouba",
      addressCountry: "TN",
    },
  },
};

export default async function Home() {
  const { openRoles, companies, latest } = await getHomeData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0A0C33_0%,#171048_42%,#3C1560_72%,#641274_100%)] px-6 py-28 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#A79FD6]">
            ESEN &middot; Talent Fair &middot; Est. all year round
          </p>
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-balance sm:text-6xl">
            From Talent Fair to{" "}
            <span className="bg-[linear-gradient(90deg,#7B53FD,#1AA6FC)] bg-clip-text text-transparent">
              Talent Network
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#D8D4F0]">
            A digital platform connecting ESEN students, alumni, companies and
            startups — the whole year, not just one day a year.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/opportunities"
              className="rounded-md bg-accent px-6 py-3 font-semibold text-white"
            >
              Browse opportunities
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Create your profile
            </Link>
          </div>

          {(openRoles !== null || companies !== null) && (
            <div className="mt-12 flex items-center justify-center gap-8 font-mono text-sm text-[#B3ADD9]">
              {openRoles !== null && (
                <span>
                  <span className="text-white">{openRoles}</span> open role
                  {openRoles === 1 ? "" : "s"}
                </span>
              )}
              {companies !== null && (
                <span>
                  <span className="text-white">{companies}</span> partner compan
                  {companies === 1 ? "y" : "ies"}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Latest opportunities</h2>
          <Link
            href="/opportunities"
            className="font-mono text-[11px] uppercase tracking-widest text-accent-2 hover:text-text"
          >
            See all
          </Link>
        </div>
        {latest.length > 0 ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {latest.map((o) => (
              <li key={o.id}>
                <Link href={`/opportunities/${o.id}`} className="block h-full">
                  <Card interactive className="h-full">
                    <Badge tone={TYPE_TONE[o.type] ?? "neutral"}>
                      {TYPE_LABEL[o.type] ?? o.type}
                    </Badge>
                    <p className="mt-2 font-display font-semibold">{o.title}</p>
                    <p className="text-sm text-text-muted">{o.company_name}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-muted [box-shadow:var(--lift)]">
            No opportunities are open just yet — new postings show up here as
            companies join. Meanwhile, the{" "}
            <Link href="/feed" className="text-accent-2 hover:text-text">
              community feed
            </Link>{" "}
            is live.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          <Feature
            eyebrow="Students"
            title="A profile that works for you"
            body="Skills, projects and experience — discover PFE and internship opportunities that actually fit."
          />
          <Feature
            eyebrow="Companies"
            title="Reach ESEN talent directly"
            body="Publish internships, PFE topics and jobs, and search student profiles instead of waiting for applications."
          />
          <Feature
            eyebrow="Everyone"
            title="Built for the ESEN community"
            body="Not another generic job board — a trusted network tied to ESEN's own students, alumni and events."
          />
        </div>
      </section>
    </>
  );
}

function Feature({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        {eyebrow}
      </p>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </div>
  );
}
