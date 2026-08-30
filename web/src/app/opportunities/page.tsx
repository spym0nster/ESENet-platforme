import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EmptyState, Input, MatchArc, Select } from "@/components/ui";
import { OpportunityCard } from "@/components/opportunity-card";
import { fetchRecommendedOpportunities } from "@/lib/opportunities";
import type { OpportunityType } from "@/types/database";

export const metadata = {
  title: "Opportunities",
  description:
    "Internships, PFE projects and jobs from verified ESEN partner companies — filter by skill and type.",
};

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

const TYPE_OPTIONS: OpportunityType[] = [
  "internship",
  "pfe",
  "job",
  "alternance",
  "freelance",
];

const SORT_OPTIONS = {
  newest: "Newest",
  starting_soon: "Starting soonest",
  deadline: "Application deadline",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

const PAGE_SIZE = 20;

export default async function OpportunitiesPage({
  searchParams,
}: PageProps<"/opportunities">) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <EmptyState
          title="Connect Supabase to see opportunities"
          body="Add your project URL and anon key to .env.local, then run the SQL in supabase/."
        />
      </div>
    );
  }

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const type = firstParam(sp.type);
  const location = firstParam(sp.location);
  const company = firstParam(sp.company);
  const skill = firstParam(sp.skill);
  const sort: SortKey =
    sp.sort === "starting_soon" || sp.sort === "deadline" ? sp.sort : "newest";
  const page = Math.max(1, parseInt(firstParam(sp.page), 10) || 1);

  const hasFilters = Boolean(q || type || location || company || skill);
  // "More filters" opens on its own when one of the hidden ones is in use
  const advancedActive = Boolean(q || location || company || sort !== "newest");

  const supabase = await createClient();
  let query = supabase
    .from("opportunities")
    .select(
      "id, type, title, description, skills, location, remote, start_date, application_deadline, companies!inner(company_name, logo_url)"
    )
    .eq("status", "published");

  if (q) {
    const safe = q.replace(/[,()]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (type && TYPE_OPTIONS.includes(type as OpportunityType)) {
    query = query.eq("type", type);
  }
  if (location) query = query.ilike("location", `%${location}%`);
  if (company) query = query.ilike("companies.company_name", `%${company}%`);
  if (skill) query = query.contains("skills", [skill]);

  if (sort === "starting_soon") {
    query = query.order("start_date", { ascending: true, nullsFirst: false });
  } else if (sort === "deadline") {
    query = query.order("application_deadline", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const offset = (page - 1) * PAGE_SIZE;
  query = query.range(offset, offset + PAGE_SIZE);

  const { data: fetched, error } = await query;
  const hasNextPage = (fetched?.length ?? 0) > PAGE_SIZE;
  const opportunities = fetched?.slice(0, PAGE_SIZE);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStudent = false;
  let studentSkills: string[] = [];
  const savedIds = new Set<string>();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStudent = profile?.role === "student";

    if (isStudent) {
      const { data: details } = await supabase
        .from("student_details")
        .select("skills")
        .eq("profile_id", user.id)
        .maybeSingle();
      studentSkills = details?.skills ?? [];
    }

    if (isStudent && opportunities && opportunities.length > 0) {
      const { data: saved } = await supabase
        .from("saved_opportunities")
        .select("opportunity_id")
        .eq("student_id", user.id)
        .in("opportunity_id", opportunities.map((o) => o.id));
      for (const row of saved ?? []) savedIds.add(row.opportunity_id);
    }
  }

  const showArcs = isStudent && studentSkills.length >= 3;

  const recommended =
    isStudent && !hasFilters && page === 1 && studentSkills.length > 0
      ? await fetchRecommendedOpportunities(supabase, studentSkills, { limit: 4 })
      : [];

  // A real number for the "nothing matched your filters" state.
  let openCount: number | null = null;
  if (hasFilters && (!opportunities || opportunities.length === 0)) {
    const { count } = await supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    openCount = count ?? null;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Opportunities
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Internships, PFE and jobs from ESEN companies
      </h1>

      <form
        className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
        action="/opportunities"
      >
        <Input
          name="skill"
          defaultValue={skill}
          placeholder="Skill — e.g. SQL, React"
          aria-label="Skill"
        />
        <Select name="type" defaultValue={type ?? ""} aria-label="Type" className="sm:w-44">
          <option value="">Any type</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-ctrl bg-accent px-5 font-sans text-sm font-semibold text-white transition duration-150 hover:brightness-105 active:translate-y-px"
        >
          Search
        </button>

        <details open={advancedActive} className="group sm:col-span-3">
          <summary className="cursor-pointer list-none py-2 font-mono text-[11px] uppercase tracking-widest text-text-faint hover:text-text">
            <span className="group-open:hidden">More filters</span>
            <span className="hidden group-open:inline">Fewer filters</span>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="q" defaultValue={q} placeholder="Keyword" aria-label="Keyword" className="lg:col-span-2" />
            <Input name="company" defaultValue={company} placeholder="Company" aria-label="Company" />
            <Input name="location" defaultValue={location} placeholder="Location" aria-label="Location" />
            <Select name="sort" defaultValue={sort} aria-label="Sort by" className="sm:col-span-2 lg:col-span-1">
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  Sort: {label}
                </option>
              ))}
            </Select>
          </div>
        </details>

        {hasFilters && (
          <Link
            href="/opportunities"
            className="font-mono text-[11px] uppercase tracking-widest text-text-muted hover:text-text sm:col-span-3"
          >
            Clear filters
          </Link>
        )}
      </form>

      {recommended.length > 0 && (
        <section className="mt-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
            Recommended for you
          </p>
          <ul className="mt-4 space-y-2">
            {recommended.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunities/${o.id}`}
                  className="flex items-center gap-3 rounded-ctrl px-3 py-2 hover:bg-surface"
                >
                  {o.requiredCount > 0 ? (
                    <MatchArc matched={o.matchCount} required={o.requiredCount} className="scale-[0.78]" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-semibold">
                      {o.title}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      {o.company_name}
                      {o.matchedSkills.length > 0
                        ? ` · ${o.matchedSkills.slice(0, 3).join(", ")}`
                        : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load opportunities: {error.message}
        </p>
      )}

      {!error && (!opportunities || opportunities.length === 0) && (
        <div className="mt-8">
          <EmptyState
            title={hasFilters ? "Nothing matches these filters" : "No opportunities yet"}
            body={
              hasFilters
                ? openCount
                  ? `${openCount} ${openCount === 1 ? "opportunity is" : "opportunities are"} open right now — try a broader skill or clear a filter.`
                  : "Try a broader skill, or clear a filter."
                : "Once a verified company posts one, it shows up here."
            }
            action={
              hasFilters ? (
                <Link
                  href="/opportunities"
                  className="font-mono text-xs uppercase tracking-widest text-accent-2 hover:text-text"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {opportunities?.map((o) => {
          const companyRow = o.companies as unknown as {
            company_name: string;
            logo_url: string | null;
          } | null;
          return (
            <li key={o.id}>
              <OpportunityCard
                opportunity={{
                  id: o.id,
                  type: o.type,
                  title: o.title,
                  skills: (o.skills as string[] | null) ?? null,
                  location: o.location,
                  remote: o.remote,
                  application_deadline:
                    (o.application_deadline as string | null) ?? null,
                  company: {
                    name: companyRow?.company_name ?? "ESEN partner company",
                    logo_url: companyRow?.logo_url ?? null,
                  },
                }}
                viewerSkills={studentSkills}
                showArc={showArcs}
                saved={isStudent ? savedIds.has(o.id) : undefined}
              />
            </li>
          );
        })}
      </ul>

      {(page > 1 || hasNextPage) && (
        <div className="mt-8 flex items-center justify-between font-mono text-xs uppercase tracking-widest">
          {page > 1 ? (
            <Link href={pageHref(sp, page - 1)} className="text-accent-2 hover:text-text">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-text-faint">Page {page}</span>
          {hasNextPage ? (
            <Link href={pageHref(sp, page + 1)} className="text-accent-2 hover:text-text">
              Next
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** Builds /opportunities?...same filters...&page=N, dropping page=1 (the default). */
function pageHref(
  sp: Record<string, string | string[] | undefined>,
  targetPage: number
): string {
  const params = new URLSearchParams();
  for (const key of ["q", "type", "location", "company", "skill", "sort"]) {
    const value = firstParam(sp[key]);
    if (value) params.set(key, value);
  }
  if (targetPage > 1) params.set("page", String(targetPage));
  const query = params.toString();
  return query ? `/opportunities?${query}` : "/opportunities";
}
