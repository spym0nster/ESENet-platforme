import { ArrowRight, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CapacityBar, DemoTag, EmptyState, PageHeader, Panel, StatTile, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { EVENT } from "@/lib/constants";
import { dashboardStats } from "@/lib/services/stats";
import { cn, formatDateTime, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaff();
  const { denied } = await searchParams;
  const s = await dashboardStats();
  const commitment = pct(s.availabilityConfirmed, s.total);

  // DATA → INTELLIGENCE → VALUE, as the actual pipeline.
  const pipeline = [
    { label: "Application", sub: "Received", value: s.total },
    { label: "Review", sub: "Shortlisted + decided", value: s.total - s.pending },
    { label: "Selection", sub: "Selected", value: s.selected },
    { label: "Assignment", sub: "Assigned", value: s.assigned },
  ];
  const teamTotals = s.teams.reduce((a, t) => ({ used: a.used + t.used, cap: a.cap + t.capacity }), { used: 0, cap: 0 });

  return (
    <div className="space-y-8">
      {denied && (
        <div role="alert" className="flex items-center gap-3 border border-gold/40 bg-gold/8 px-4 py-3 text-sm text-gold">
          <ShieldAlert className="size-4" /> That page is restricted to admins.
        </div>
      )}

      <PageHeader
        eyebrow={`${EVENT.name} · OC`}
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Who applied, who to select, and who is assigned where — at a glance."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/candidates?status=PENDING">Review pending</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/assignments">
                Assign selected <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      {/* Application stats */}
      <section aria-label="Applications" className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 2xl:grid-cols-8">
        <StatTile label="Total applications" value={s.total} href="/admin/candidates" />
        <StatTile label="Pending review" value={s.pending} tone={s.pending ? "azure" : "default"} href="/admin/candidates?status=PENDING" />
        <StatTile label="Shortlisted" value={s.shortlisted} href="/admin/candidates?status=SHORTLISTED" />
        <StatTile label="Selected" value={s.selected} tone="green" href="/admin/candidates?status=SELECTED" />
        <StatTile label="Waitlist" value={s.waitlist} tone={s.waitlist ? "gold" : "default"} href="/admin/candidates?status=WAITLIST" />
        <StatTile label="Rejected" value={s.rejected} href="/admin/candidates?status=REJECTED" />
        <StatTile label="Assigned" value={s.assigned} href="/admin/candidates?assigned=yes" />
        <StatTile label="Unassigned" value={s.unassigned} hint="Selected, no mission yet" tone={s.unassigned ? "gold" : "default"} href="/admin/assignments?view=unassigned" />
      </section>

      {/* Pipeline */}
      <Panel title="Pipeline" eyebrow="Data → Intelligence → Value">
        <ol className="grid gap-4 md:grid-cols-4 md:gap-0">
          {pipeline.map((p, i) => (
            <li key={p.label} className="relative md:pr-6">
              <div className="flex items-center gap-2" aria-hidden>
                <span className={cn("size-2.5 rounded-full border", i === pipeline.length - 1 ? "border-green bg-green" : "border-azure bg-azure/30")} />
                {i < pipeline.length - 1 && <span className="hidden h-px flex-1 bg-line-strong md:block" />}
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {String(i + 1).padStart(2, "0")} · {p.label}
              </p>
              <p className="tabular mt-1 font-display text-3xl font-extrabold">{p.value}</p>
              <p className="text-xs text-dim">
                {p.sub}
                {i > 0 && pipeline[0]!.value > 0 && <> · {pct(p.value, pipeline[0]!.value)}%</>}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Commitment */}
        <Panel title="3-day commitment" eyebrow="J-2 · J-1 · Jour J">
          <div className="flex items-end justify-between">
            <p className={cn("tabular font-display text-5xl font-extrabold", commitment === 100 || s.total === 0 ? "text-green" : "text-danger")}>
              {s.total === 0 ? "—" : `${commitment}%`}
            </p>
            <p className="text-right text-xs text-muted">
              {s.availabilityConfirmed} / {s.total}
              <br />
              confirmed all three days
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-px bg-line">
            {["J-2", "J-1", "JOUR J"].map((d) => (
              <div key={d} className="bg-bg py-2 text-center font-mono text-xs tracking-[0.14em]">
                <span className="text-green">●</span> {d}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-dim">Enforced at submission and by a database constraint — partial availability can&apos;t be stored.</p>
        </Panel>

        {/* Team capacity */}
        <Panel
          title="Team capacity"
          className="xl:col-span-2"
          actions={<span className="tabular font-mono text-xs text-muted">{teamTotals.used} / {teamTotals.cap} seats</span>}
        >
          {s.teams.length === 0 ? (
            <EmptyState title="No teams yet">Create teams in <Link className="text-azure" href="/admin/teams">Teams</Link>.</EmptyState>
          ) : (
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {s.teams.map((t) => (
                <Link key={t.id} href={`/admin/teams#${t.id}`} className="block hover:opacity-90">
                  <CapacityBar used={t.used} capacity={t.capacity} label={t.name} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Mission coverage">
          <div className="space-y-4">
            {s.missions.map((m) => (
              <CapacityBar key={m.id} used={m.used} capacity={m.capacity} label={m.name} />
            ))}
            {s.missions.length === 0 && <p className="text-sm text-muted">No active missions.</p>}
          </div>
        </Panel>

        <Panel title="Latest applications" actions={<Link href="/admin/candidates" className="text-xs text-azure hover:underline">All</Link>} bodyClassName="p-0">
          {s.recent.length === 0 ? (
            <div className="p-5"><EmptyState title="No applications yet">Share the application link: /apply</EmptyState></div>
          ) : (
            <ul className="divide-y divide-line">
              {s.recent.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/candidates/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2 sm:px-5">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 truncate text-sm font-medium">{c.fullName} {c.isDemo && <DemoTag />}</span>
                      <span className="block truncate text-xs text-dim">{c.specialization} · {formatDateTime(c.createdAt)}</span>
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" actions={user.role === "ADMIN" ? <Link href="/admin/audit" className="text-xs text-azure hover:underline">Audit log</Link> : undefined} bodyClassName="p-0">
          {s.activity.length === 0 ? (
            <p className="p-5 text-sm text-muted">No staff activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {s.activity.map((a) => (
                <li key={a.id} className="px-4 py-3 sm:px-5">
                  <p className="text-sm">{a.summary}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                    {a.user?.name ?? "Public form"} · {formatDateTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
