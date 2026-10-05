import type { Metadata } from "next";
import { MissionDialog } from "@/components/admin/org-forms";
import { CapacityBar, EmptyState, PageHeader } from "@/components/admin/ui";
import { isAdmin, requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Missions" };

const WEIGHT_LABEL: Record<number, string> = { 1: "Useful", 2: "Core", 3: "Critical" };

export default async function MissionsPage() {
  const user = await requireStaff();
  const admin = isAdmin(user);

  const [missions, teams, skills] = await Promise.all([
    db.mission.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        team: { select: { id: true, name: true } },
        skills: { include: { skill: { select: { id: true, name: true } } }, orderBy: [{ weight: "desc" }, { skill: { sortOrder: "asc" } }] },
        _count: { select: { assignments: { where: { active: true } } } },
      },
    }),
    db.team.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.skill.findMany({ where: { active: true, isOther: false }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation"
        title="Missions"
        description="What the OC does across J-2, J-1 and Jour J, and which skills each mission needs. Skill weights feed the recommendation score."
        actions={admin ? <MissionDialog teams={teams} skills={skills} /> : undefined}
      />

      {missions.length === 0 ? (
        <EmptyState title="No missions yet">{admin ? "Create the first mission." : "An admin needs to create missions."}</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {missions.map((m) => (
            <article key={m.id} className={cn("flex flex-col border bg-surface", m.active ? "border-line" : "border-dashed border-line opacity-60")}>
              <header className="flex items-start justify-between gap-3 border-b border-line p-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-extrabold uppercase [font-stretch:112%]">{m.name}</h2>
                  <p className="text-xs text-muted">
                    {m.team ? m.team.name : "No default team"}
                    {!m.active && <span className="ml-2 font-mono uppercase tracking-[0.14em] text-gold">Inactive</span>}
                  </p>
                </div>
                {admin && (
                  <MissionDialog
                    teams={teams}
                    skills={skills}
                    mission={{
                      id: m.id,
                      name: m.name,
                      description: m.description ?? "",
                      capacity: m.capacity,
                      teamId: m.teamId,
                      active: m.active,
                      skills: m.skills.map((s) => ({ skillId: s.skillId, weight: s.weight })),
                    }}
                  />
                )}
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">
                {m.description && <p className="text-sm text-muted">{m.description}</p>}
                <div className="mt-auto space-y-4">
                  <div>
                    <p className="eyebrow text-dim">Recommended skills</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.skills.length === 0 && <span className="text-xs text-dim">None — this mission won&apos;t be recommended.</span>}
                      {m.skills.map((s) => (
                        <span
                          key={s.skillId}
                          title={WEIGHT_LABEL[s.weight]}
                          className={cn(
                            "inline-flex h-6 items-center gap-1.5 border px-2 text-xs",
                            s.weight >= 2 ? "border-green/40 text-text" : "border-line-strong text-muted",
                          )}
                        >
                          {s.weight >= 2 && <span className="size-1.5 rounded-full bg-green" aria-hidden />}
                          {s.skill.name}
                          <span className="sr-only">({WEIGHT_LABEL[s.weight]})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <CapacityBar used={m._count.assignments} capacity={m.capacity} label="Assigned" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-dim">
        <span className="mr-1 inline-block size-1.5 rounded-full bg-green align-middle" /> Core / critical skill (counts double or triple in the score).
      </p>
    </div>
  );
}
