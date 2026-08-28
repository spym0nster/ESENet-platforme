import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Badge, EmptyState, Input, Select } from "@/components/ui";
import { SaveOpportunityButton } from "@/components/save-opportunity-button";
import { fetchRecommendedOpportunities } from "@/lib/opportunities";
import type { OpportunityType } from "@/types/database";

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

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const type = firstParam(sp.type);
  const location = firstParam(sp.location);
  const company = firstParam(sp.company);
  const skill = firstParam(sp.skill);
  const sort: SortKey =
    sp.sort === "starting_soon" || sp.sort === "deadline"
      ? sp.sort
      : "newest";
  const page = Math.max(1, parseInt(firstParam(sp.page), 10) || 1);

  const hasFilters = Boolean(q || type || location || company || skill);

  const supabase = await createClient();
  let query = supabase
    .from("opportunities")
    .select(
      "id, type, title, description, skills, location, remote, start_date, application_deadline, companies!inner(company_name)"
    )
    .eq("status", "published");

  if (q) {
    const safe = q.replace(/[,()]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (type && TYPE_OPTIONS.includes(type as OpportunityType)) {
    query = query.eq("type", type);
  }
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }
  if (company) {
    query = query.ilike("companies.company_name", `%${company}%`);
  }
  if (skill) {
    query = query.contains("skills", [skill]);
  }

  if (sort === "starting_soon") {
    query = query.order("start_date", { ascending: true, nullsFirst: false });
  } else if (sort === "deadline") {
    query = query.order("application_deadline", {
      ascending: true,
      nullsFirst: false,
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Fetch one extra row past the page size instead of a separate COUNT
  // query — its presence alone tells us whether a next page exists, no
  // second round trip needed. Was previously unbounded (every published,
  // verified opportunity in one query) — fine at QA scale, not at real
  // volume.
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
        .in(
          "opportunity_id",
          opportunities.map((o) => o.id)
        );
      for (const row of saved ?? []) savedIds.add(row.opportunity_id);
    }
  }

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const soonIso = new Date(now.getTime() + 7 * 864e5)
    .toISOString()
    .slice(0, 10);

  // Skill-overlap recommendations — only worth showing on the unfiltered
  // first page (once a student is searching, that intent wins).
  const recommended =
    isStudent && !hasFilters && page === 1 && studentSkills.length > 0
      ? await fetchRecommendedOpportunities(supabase, studentSkills, {
          limit: 4,
        })
      : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Opportunities
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold">
        Internships &amp; PFE, published by real companies
      </h1>

      <form className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" action="/opportunities">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Keyword…"
          className="lg:col-span-2"
          aria-label="Keyword"
        />
        <Input name="company" defaultValue={company} placeholder="Company" aria-label="Company" />
        <Input name="location" defaultValue={location} placeholder="Location" aria-label="Location" />
        <Select name="type" defaultValue={type ?? ""} aria-label="Type">
          <option value="">Any type</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Input name="skill" defaultValue={skill} placeholder="Skill (e.g. SQL)" aria-label="Skill" />
        <Select name="sort" defaultValue={sort} aria-label="Sort by">
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              Sort: {label}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-3 lg:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2.5 font-mono text-sm text-white"
          >
            Search
          </button>
          {hasFilters && (
            <Link href="/opportunities" className="py-2 font-mono text-xs text-text-muted hover:text-text">
              Clear filters
            </Link>
          )}
        </div>
      </form>

      {recommended.length > 0 && (
        <section className="mt-10 rounded-lg border border-accent-2/30 bg-accent2-soft/40 p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
            Recommended for you
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Based on the skills on your profile.
          </p>
          <ul className="mt-4 space-y-2">
            {recommended.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunities/${o.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md px-3 py-2 hover:bg-surface"
                >
                  <span className="font-display text-sm font-bold">
                    {o.title}
                    <span className="ml-2 font-sans font-normal text-text-muted">
                      {o.company_name}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-accent-2">
                    {o.matchCount} skill{o.matchCount === 1 ? "" : "s"} match
                    {o.matchedSkills.length > 0
                      ? ` · ${o.matchedSkills.slice(0, 3).join(", ")}`
                      : ""}
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
            title={hasFilters ? "No opportunities match your filters." : "No opportunities published yet."}
            body={
              hasFilters
                ? "Try clearing a filter or searching a broader term."
                : "Once a verified company posts one, it shows up here."
            }
            action={
              hasFilters ? (
                <Link href="/opportunities" className="inline-block py-2 font-mono text-sm text-accent-2">
                  Clear filters →
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {opportunities?.map((o) => (
          <li key={o.id}>
            <div className="rounded-lg border border-border bg-surface p-6 transition hover:border-accent-2/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{TYPE_LABEL[o.type] ?? o.type}</Badge>
                  {o.location && (
                    <span className="text-xs text-text-faint">{o.location}</span>
                  )}
                  {o.remote && (
                    <span className="text-xs text-text-faint">Remote</span>
                  )}
                  {o.application_deadline &&
                    o.application_deadline < todayIso && (
                      <span className="font-mono text-xs text-text-faint">
                        Applications closed
                      </span>
                    )}
                  {o.application_deadline &&
                    o.application_deadline >= todayIso &&
                    o.application_deadline <= soonIso && (
                      <Badge variant="danger">
                        Closes{" "}
                        {new Date(o.application_deadline).toLocaleDateString(
                          undefined,
                          { day: "numeric", month: "short" }
                        )}
                      </Badge>
                    )}
                </div>
                {isStudent && (
                  <SaveOpportunityButton
                    opportunityId={o.id}
                    initiallySaved={savedIds.has(o.id)}
                  />
                )}
              </div>
              <Link href={`/opportunities/${o.id}`} className="mt-2 block">
                <h2 className="font-display text-lg font-bold">{o.title}</h2>
                <p className="mt-1 text-sm text-text-muted">
                  {(o.companies as unknown as { company_name: string } | null)
                    ?.company_name ?? "ESEN partner company"}
                </p>
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {(page > 1 || hasNextPage) && (
        <div className="mt-8 flex items-center justify-between font-mono text-sm">
          {page > 1 ? (
            <Link href={pageHref(sp, page - 1)} className="text-accent-2 hover:text-text">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-text-faint">Page {page}</span>
          {hasNextPage ? (
            <Link href={pageHref(sp, page + 1)} className="text-accent-2 hover:text-text">
              Next →
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
