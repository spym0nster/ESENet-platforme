import type { Metadata } from "next";
import Link from "next/link";
import { TeamDialog } from "@/components/admin/org-forms";
import { CapacityBar, EmptyState, PageHeader, Tag } from "@/components/admin/ui";
import { isAdmin, requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage() {
  const user = await requireStaff();
  const admin = isAdmin(user);

  const [teams, staff] = await Promise.all([
    db.team.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        supervisor: { select: { id: true, name: true } },
        missions: { where: { active: true }, select: { id: true, name: true } },
        assignments: {
          where: { active: true },
          orderBy: [{ isLead: "desc" }, { candidate: { fullName: "asc" } }],
          select: { id: true, isLead: true, subRole: true, mission: { select: { name: true } }, candidate: { select: { id: true, fullName: true, phone: true } } },
        },
      },
    }),
    admin ? db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation"
        title="Teams"
        description="Operational teams, their capacity, leaders and members. Defaults are editable — nothing here is fixed."
        actions={admin ? <TeamDialog staff={staff} /> : undefined}
      />

      {teams.length === 0 ? (
        <EmptyState title="No teams yet">{admin ? "Create the first team." : "An admin needs to create teams."}</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((t) => {
            const leads = t.assignments.filter((a) => a.isLead);
            return (
              <article id={t.id} key={t.id} className={cn("scroll-mt-6 border bg-surface", t.active ? "border-line" : "border-dashed border-line opacity-60")}>
                <header className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-extrabold uppercase [font-stretch:112%]">{t.name}</h2>
                    {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
                    {!t.active && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">Inactive</p>}
                  </div>
                  {admin && (
                    <TeamDialog
                      staff={staff}
                      team={{ id: t.id, name: t.name, description: t.description ?? "", capacity: t.capacity, supervisorId: t.supervisorId, active: t.active }}
                    />
                  )}
                </header>
                <div className="space-y-4 p-4 sm:p-5">
                  <CapacityBar used={t.assignments.length} capacity={t.capacity} label="Members" />
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="eyebrow text-dim">Team leader{leads.length === 1 ? "" : "s"}</dt>
                      <dd className="mt-1">{leads.length ? leads.map((l) => l.candidate.fullName).join(", ") : <span className="text-dim">Not set</span>}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-dim">Ambassador in charge</dt>
                      <dd className="mt-1">{t.supervisor?.name ?? <span className="text-dim">Not set</span>}</dd>
                    </div>
                  </dl>
                  {t.missions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.missions.map((m) => (
                        <Tag key={m.id}>{m.name}</Tag>
                      ))}
                    </div>
                  )}
                  <div>
                    <p className="eyebrow text-dim">Members</p>
                    {t.assignments.length === 0 ? (
                      <p className="mt-2 text-sm text-dim">
                        Nobody assigned yet. <Link href="/admin/assignments" className="text-azure hover:underline">Assign people</Link>
                      </p>
                    ) : (
                      <ul className="mt-2 divide-y divide-line border-y border-line">
                        {t.assignments.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <Link href={`/admin/candidates/${a.candidate.id}`} className="min-w-0 truncate hover:text-azure">
                              {a.candidate.fullName}
                              {a.isLead && <span className="ml-2 font-mono text-[10px] text-green">LEAD</span>}
                            </Link>
                            <span className="shrink-0 truncate text-xs text-muted">
                              {a.subRole ? `${a.subRole} · ` : ""}
                              {a.mission.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
