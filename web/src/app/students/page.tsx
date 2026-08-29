import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Badge, EmptyState, Input } from "@/components/ui";
import { fetchStudents, availabilityLabel } from "@/lib/students";

// Student profiles are personal data — visible to signed-in members
// (companies are the audience), never to anonymous crawlers.
export const metadata: Metadata = {
  title: "Students",
  description:
    "Search ESEN students and recent graduates by skill, availability and what they're looking for.",
  robots: { index: false, follow: false },
};

export default async function StudentsPage({
  searchParams,
}: PageProps<"/students">) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">
          Connect Supabase to see student profiles
        </h1>
        <p className="mt-3 text-text-muted">
          Add your project URL and anon key to{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">
            .env.local
          </code>{" "}
          and run the SQL in{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">
            supabase/
          </code>
          .
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
          Students
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold">
          Browse ESEN talent
        </h1>
        <p className="mt-4 text-text-muted">
          Student profiles are visible to signed-in members. Log in or create a
          company account to search students by skill, availability and what
          they&rsquo;re looking for.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/login?next=/students"
            className="rounded-md bg-accent px-6 py-3 font-semibold text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-border px-6 py-3 font-semibold hover:border-accent-2/50"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const skill = firstParam(sp.skill);
  const looking = firstParam(sp.looking);
  const availableNow = firstParam(sp.available) === "1";
  const page = Math.max(1, parseInt(firstParam(sp.page), 10) || 1);

  const hasFilters = Boolean(q || skill || looking || availableNow);

  const { students, hasNextPage, error } = await fetchStudents(supabase, {
    q,
    skill,
    looking,
    availableNow,
    page,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Students
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold">
        ESEN students &amp; recent graduates
      </h1>
      <p className="mt-2 text-text-muted">
        Search by skill, availability, or what someone&rsquo;s looking for —
        then reach out or invite them to an opportunity.
      </p>

      <form
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        action="/students"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Keyword (headline, bio)…"
          className="lg:col-span-2"
          aria-label="Keyword"
        />
        <Input
          name="skill"
          defaultValue={skill}
          placeholder="Skill (e.g. React)"
          aria-label="Skill"
        />
        <Input
          name="looking"
          defaultValue={looking}
          placeholder="Looking for (e.g. PFE)"
          aria-label="Looking for"
        />
        <label className="flex items-center gap-2 font-mono text-xs text-text-muted sm:col-span-2">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={availableNow}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Available now
        </label>
        <div className="flex items-center gap-3 lg:col-span-2 lg:justify-end">
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2.5 font-mono text-sm text-white"
          >
            Search
          </button>
          {hasFilters && (
            <Link
              href="/students"
              className="py-2 font-mono text-xs text-text-muted hover:text-text"
            >
              Clear filters
            </Link>
          )}
        </div>
      </form>

      {error && <p className="mt-8 text-sm text-magenta">{error}</p>}

      {!error && students.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title={
              hasFilters
                ? "No students match your filters."
                : "No student profiles yet."
            }
            body={
              hasFilters
                ? "Try a broader skill or clearing a filter."
                : "Once students fill in their profiles, they show up here."
            }
            action={
              hasFilters ? (
                <Link
                  href="/students"
                  className="inline-block py-2 font-mono text-sm text-accent-2"
                >
                  Clear filters →
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/students/${s.id}`}
              className="block rounded-lg border border-border bg-surface p-6 transition hover:border-accent-2/50"
            >
              <div className="flex items-start gap-4">
                {s.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
                  <img
                    src={s.avatar_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-alt font-display text-lg font-bold text-text-faint">
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">
                      {s.full_name}
                    </h2>
                    <Badge variant="info">{availabilityLabel(s.availability)}</Badge>
                  </div>
                  {s.headline && (
                    <p className="mt-1 text-sm text-text-muted">{s.headline}</p>
                  )}
                  {s.looking_for && (
                    <p className="mt-1 text-xs text-text-faint">
                      Looking for: {s.looking_for}
                    </p>
                  )}
                  {s.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.skills.slice(0, 8).map((skillName) => (
                        <span
                          key={skillName}
                          className="rounded border border-border bg-surface-alt px-2 py-0.5 font-mono text-xs text-text-muted"
                        >
                          {skillName}
                        </span>
                      ))}
                      {s.skills.length > 8 && (
                        <span className="px-1 py-0.5 font-mono text-xs text-text-faint">
                          +{s.skills.length - 8}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {(page > 1 || hasNextPage) && (
        <div className="mt-8 flex items-center justify-between font-mono text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(sp, page - 1)}
              className="text-accent-2 hover:text-text"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-text-faint">Page {page}</span>
          {hasNextPage ? (
            <Link
              href={pageHref(sp, page + 1)}
              className="text-accent-2 hover:text-text"
            >
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

/** Builds /students?...same filters...&page=N, dropping page=1 (the default). */
function pageHref(
  sp: Record<string, string | string[] | undefined>,
  targetPage: number
): string {
  const params = new URLSearchParams();
  for (const key of ["q", "skill", "looking", "available"]) {
    const value = firstParam(sp[key]);
    if (value) params.set(key, value);
  }
  if (targetPage > 1) params.set("page", String(targetPage));
  const query = params.toString();
  return query ? `/students?${query}` : "/students";
}
