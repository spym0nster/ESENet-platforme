import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EmptyState, Input } from "@/components/ui";
import { fetchCompanyDirectory } from "@/lib/companies";

export const metadata = {
  title: "Companies",
  description:
    "ESEN partner companies and startups hiring students and recent graduates.",
};

function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function CompaniesPage({
  searchParams,
}: PageProps<"/companies">) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold">
          Connect Supabase to see companies
        </h1>
        <p className="mt-3 text-text-muted">
          Add your project URL and anon key to{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">
            .env.local
          </code>
          .
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const q = firstParam(sp.q);

  const supabase = await createClient();
  const companies = await fetchCompanyDirectory(supabase, { q });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Companies
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold">
        Companies &amp; startups on ESENet
      </h1>
      <p className="mt-2 text-text-muted">
        Verified ESEN partners hiring interns, PFE students and graduates.
      </p>

      <form className="mt-8 flex gap-3" action="/companies">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Company name…"
          aria-label="Company name"
          className="max-w-xs"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-5 py-2.5 font-mono text-sm text-white"
        >
          Search
        </button>
        {q && (
          <Link
            href="/companies"
            className="py-2 font-mono text-xs text-text-muted hover:text-text"
          >
            Clear
          </Link>
        )}
      </form>

      {companies.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={q ? "No companies match that name." : "No companies yet."}
            body={
              q
                ? "Try a shorter or different search."
                : "Verified companies show up here once ESENet approves them."
            }
            action={
              q ? (
                <Link
                  href="/companies"
                  className="inline-block py-2 font-mono text-sm text-accent-2"
                >
                  Clear search →
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/companies/${c.id}`}
                className="flex h-full gap-4 rounded-lg border border-border bg-surface p-5 transition hover:border-accent-2/50"
              >
                {c.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
                  <img
                    src={c.logo_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md bg-surface-alt object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-alt font-display text-lg font-semibold text-text-faint">
                    {c.company_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold">
                    {c.company_name}
                  </h2>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-xs text-accent-2">
                    {c.openRoles === 0
                      ? "No open roles right now"
                      : `${c.openRoles} open role${c.openRoles === 1 ? "" : "s"}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
