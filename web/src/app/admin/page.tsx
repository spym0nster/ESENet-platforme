import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
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
      <p className="mt-2 text-text-muted">Platform health at a glance.</p>

      {needsAttention.length > 0 ? (
        <div className="mt-8 rounded-card border border-accent-2/30 bg-accent2-soft/30 p-5">
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
      ) : (
        <div className="mt-8 rounded-card border border-border bg-surface px-5 py-4 [box-shadow:var(--lift)]">
          <p className="text-sm text-text-muted">
            Nothing in the queues — no companies awaiting verification, no open
            reports.
          </p>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
          People
        </h2>
        <StatStrip
          items={[
            { label: "Students", value: stats.students },
            { label: "Companies", value: stats.companies },
            {
              label: "Verified",
              value: stats.companiesVerified,
              sub: `${stats.companiesPending} pending`,
            },
            { label: "Deactivated", value: stats.deactivated },
            { label: "Signups · 7d", value: stats.signupsLast7 },
            { label: "Signups · 30d", value: stats.signupsLast30 },
          ]}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Marketplace
        </h2>
        <StatStrip
          items={[
            { label: "Opportunities", value: stats.opportunities },
            { label: "Published", value: stats.opportunitiesPublished },
            { label: "Pending", value: stats.opportunitiesPending },
            { label: "Closed", value: stats.opportunitiesClosed },
            { label: "Applications", value: stats.applications },
            { label: "Community posts", value: stats.posts },
          ]}
        />
      </section>

      {stats.applications > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Applications by status
          </h2>
          <StatStrip
            items={STATUS_ORDER.filter((s) => stats.applicationsByStatus[s]).map(
              (s) => ({
                label: s[0].toUpperCase() + s.slice(1),
                value: stats.applicationsByStatus[s],
              })
            )}
          />
        </section>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
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

/**
 * A run of counts as one hairline-divided strip — not a grid of cards. The
 * `gap-px` over a `bg-border` fill draws the 1px dividers; each cell repaints
 * `bg-surface` on top.
 */
function StatStrip({
  items,
}: {
  items: { label: string; value: number; sub?: string }[];
}) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
      {items.map((s) => (
        <div key={s.label} className="bg-surface px-4 py-3">
          <dd className="font-display text-2xl font-extrabold tabular-nums">
            {s.value}
          </dd>
          <dt className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-text-faint">
            {s.label}
          </dt>
          {s.sub && <dd className="mt-0.5 text-xs text-text-muted">{s.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}
