import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Card } from "@/components/ui";
import { fetchAdminStats } from "@/lib/admin";

const STATUS_ORDER = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
];

export const metadata = {
  title: "Admin overview",
  robots: { index: false },
};

export default async function AdminOverviewPage() {
  if (!isSupabaseConfigured()) notFound();

  const { supabase } = await requireAdminUser("/admin");
  const stats = await fetchAdminStats(supabase);

  const needsAttention: { label: string; href: string }[] = [];
  if (stats.companiesPending > 0) {
    needsAttention.push({
      label: `${stats.companiesPending} ${
        stats.companiesPending === 1 ? "company" : "companies"
      } pending verification`,
      href: "/admin/companies",
    });
  }
  if (stats.openReports > 0) {
    needsAttention.push({
      label: `${stats.openReports} open ${
        stats.openReports === 1 ? "report" : "reports"
      }`,
      href: "/admin/reports",
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Admin
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Overview</h1>
      <p className="mt-2 text-text-muted">
        Platform health at a glance. Counts need migration{" "}
        <code className="rounded bg-surface-alt px-1 py-0.5 font-mono text-xs">
          0016
        </code>{" "}
        applied for opportunities and applications.
      </p>

      {needsAttention.length > 0 && (
        <div className="mt-8 rounded-lg border border-accent-2/40 bg-accent2-soft/40 p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent-2">
            Needs attention
          </h2>
          <ul className="mt-3 space-y-1.5">
            {needsAttention.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-semibold text-text hover:text-accent-2"
                >
                  {item.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          People
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Students" value={stats.students} />
          <Stat label="Companies" value={stats.companies} />
          <Stat
            label="Verified companies"
            value={stats.companiesVerified}
            sub={`${stats.companiesPending} pending`}
          />
          <Stat label="Deactivated accounts" value={stats.deactivated} />
          <Stat label="New signups · 7d" value={stats.signupsLast7} />
          <Stat label="New signups · 30d" value={stats.signupsLast30} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          Marketplace
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Opportunities" value={stats.opportunities} />
          <Stat label="Published" value={stats.opportunitiesPublished} />
          <Stat label="Pending" value={stats.opportunitiesPending} />
          <Stat label="Closed" value={stats.opportunitiesClosed} />
          <Stat label="Applications" value={stats.applications} />
          <Stat label="Community posts" value={stats.posts} />
        </div>
      </section>

      {stats.applications > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
            Applications by status
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {STATUS_ORDER.filter((s) => stats.applicationsByStatus[s]).map((s) => (
              <Stat
                key={s}
                label={s[0].toUpperCase() + s.slice(1)}
                value={stats.applicationsByStatus[s]}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          Queues
        </h2>
        <div className="mt-4 flex flex-wrap gap-4 font-mono text-sm">
          <Link href="/admin/companies" className="py-2 text-accent-2 hover:text-text">
            Company verification →
          </Link>
          <Link href="/admin/reports" className="py-2 text-accent-2 hover:text-text">
            Content reports →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card>
      <p className="font-display text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-wide text-text-faint">
        {label}
      </p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}
