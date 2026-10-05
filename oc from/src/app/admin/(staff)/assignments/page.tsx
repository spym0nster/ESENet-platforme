import { ArrowRight, Check, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AssignForm } from "@/components/admin/assign-form";
import { AssignmentControls } from "@/components/admin/candidate-controls";
import { DemoTag, EmptyState, PageHeader, Panel, ScorePill, Tag } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import type { Prisma } from "@/generated/prisma/client";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignMissionOptions, loadMatchMissions, loadTeamOptions, recommend } from "@/lib/services/matching";
import { getSettings } from "@/lib/services/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Assignments" };

type View = "unassigned" | "assigned" | "all";
const VIEWS: { key: View; label: string }[] = [
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned", label: "Assigned" },
  { key: "all", label: "All selected" },
];

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; candidate?: string; mission?: string; q?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const view: View = sp.view === "assigned" || sp.view === "all" ? sp.view : "unassigned";
  const q = (sp.q ?? "").trim().slice(0, 100);

  const where: Prisma.CandidateWhereInput = {
    status: "SELECTED",
    ...(view === "unassigned" ? { assignments: { none: { active: true } } } : {}),
    ...(view === "assigned" ? { assignments: { some: { active: true } } } : {}),
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { specialization: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const [missions, teams, settings, list, counts] = await Promise.all([
    loadMatchMissions(),
    loadTeamOptions(),
    getSettings(),
    db.candidate.findMany({
      where,
      orderBy: { fullName: "asc" },
      take: 300,
      select: {
        id: true,
        fullName: true,
        specialization: true,
        isDemo: true,
        eventExperience: true,
        ambassadorExperience: true,
        skills: { select: { skillId: true } },
        assignments: { where: { active: true }, select: { mission: { select: { name: true } }, team: { select: { name: true } } } },
      },
    }),
    Promise.all([
      db.candidate.count({ where: { status: "SELECTED", assignments: { none: { active: true } } } }),
      db.candidate.count({ where: { status: "SELECTED", assignments: { some: { active: true } } } }),
    ]),
  ]);

  const rows = list.map((c) => {
    const recs = recommend({ skillIds: c.skills.map((s) => s.skillId), eventExperience: c.eventExperience, ambassadorExperience: c.ambassadorExperience }, missions);
    return { ...c, top: recs[0] };
  });

  // Selected candidate (right panel)
  const selectedId = sp.candidate;
  const selected = selectedId
    ? await db.candidate.findUnique({
        where: { id: selectedId },
        select: {
          id: true,
          fullName: true,
          status: true,
          classYear: true,
          specialization: true,
          eventExperience: true,
          ambassadorExperience: true,
          otherSkill: true,
          skills: { select: { skillId: true, skill: { select: { name: true, isOther: true } } }, orderBy: { skill: { sortOrder: "asc" } } },
          assignments: {
            where: { active: true },
            select: { id: true, subRole: true, isLead: true, notes: true, mission: { select: { name: true } }, team: { select: { name: true } } },
          },
        },
      })
    : null;
  const selectedRecs = selected
    ? recommend({ skillIds: selected.skills.map((s) => s.skillId), eventExperience: selected.eventExperience, ambassadorExperience: selected.ambassadorExperience }, missions)
    : [];

  const href = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { view, q: q || undefined, candidate: sp.candidate, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v);
    if (merged.view === "unassigned") u.delete("view");
    return `/admin/assignments${u.size ? `?${u}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Selection → Assignment"
        title="Assignments"
        description="Pick a selected candidate, check the recommended missions, and assign mission, team and role."
        actions={
          <div className="flex gap-6 font-mono text-xs">
            <span>
              <span className="text-gold">{counts[0]}</span> <span className="text-muted">unassigned</span>
            </span>
            <span>
              <span className="text-green">{counts[1]}</span> <span className="text-muted">assigned</span>
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
        {/* Candidate list */}
        <Panel bodyClassName="p-0" className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-hidden lg:flex lg:flex-col">
          <div className="border-b border-line p-3">
            <div className="grid grid-cols-3 gap-px bg-line">
              {VIEWS.map((v) => (
                <Link
                  key={v.key}
                  href={href({ view: v.key, candidate: undefined })}
                  className={cn("bg-surface py-2 text-center text-xs", view === v.key ? "bg-surface-3 text-text" : "text-muted hover:text-text")}
                  aria-current={view === v.key ? "page" : undefined}
                >
                  {v.label}
                </Link>
              ))}
            </div>
            <form action="/admin/assignments" className="relative mt-3">
              {view !== "unassigned" && <input type="hidden" name="view" value={view} />}
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
              <Input name="q" defaultValue={q} placeholder="Search selected…" className="h-9 bg-bg pl-9" aria-label="Search selected candidates" />
            </form>
          </div>
          <ul className="divide-y divide-line overflow-y-auto lg:flex-1">
            {rows.length === 0 && (
              <li className="p-6 text-center text-sm text-muted">
                {view === "unassigned" ? "Everyone selected is assigned." : "No candidates here."}
                <br />
                <Link href="/admin/candidates?status=SHORTLISTED" className="text-azure hover:underline">Review shortlisted candidates</Link>
              </li>
            )}
            {rows.map((c) => {
              const a = c.assignments[0];
              const isSel = c.id === selectedId;
              return (
                <li key={c.id}>
                  <Link
                    href={href({ candidate: c.id, mission: undefined })}
                    scroll={false}
                    className={cn("block px-4 py-3 transition-colors", isSel ? "bg-surface-3" : "hover:bg-surface-2")}
                    aria-current={isSel ? "true" : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 truncate text-sm font-medium">
                        {c.fullName} {c.isDemo && <DemoTag />}
                      </span>
                      {a ? <Check className="size-4 shrink-0 text-green" /> : c.top && <ScorePill score={c.top.score} className="h-5 min-w-10 text-[10px]" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-dim">
                      {a ? (
                        <>
                          <span className="text-muted">{a.mission.name}</span> · {a.team.name}
                        </>
                      ) : c.top && c.top.score > 0 ? (
                        <>Best match: {c.top.missionName}</>
                      ) : (
                        c.specialization
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Workspace */}
        <div className="min-w-0 space-y-6">
          {!selected ? (
            <>
              <EmptyState title="Select a candidate">
                Choose someone from the list to see their recommended missions and assign them.
              </EmptyState>
              <TeamBoard />
            </>
          ) : selected.status !== "SELECTED" ? (
            <EmptyState title={`${selected.fullName} is not selected`} action={<Link className="text-azure" href={`/admin/candidates/${selected.id}`}>Open profile</Link>}>
              Only selected candidates can be assigned.
            </EmptyState>
          ) : (
            <>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow">Candidate</p>
                    <h2 className="mt-1 font-display text-2xl font-extrabold uppercase [font-stretch:112%]">{selected.fullName}</h2>
                    <p className="text-sm text-muted">
                      {selected.classYear} · {selected.specialization}
                      {selected.eventExperience && " · Event experience"}
                      {selected.ambassadorExperience && " · ESEN experience"}
                    </p>
                  </div>
                  <Link href={`/admin/candidates/${selected.id}`} className="inline-flex items-center gap-1 text-sm text-azure hover:underline">
                    Full profile <ArrowRight className="size-4" />
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selected.skills.map((s) => (
                    <Tag key={s.skillId} className="text-text">
                      {s.skill.name}
                      {s.skill.isOther && selected.otherSkill ? `: ${selected.otherSkill}` : ""}
                    </Tag>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-6 xl:grid-cols-2">
                <Panel title="Recommended missions" eyebrow="Click one to pre-fill the form">
                  <ol className="space-y-1">
                    {selectedRecs.map((r) => (
                      <li key={r.missionId}>
                        <Link
                          href={href({ mission: r.missionId })}
                          scroll={false}
                          className={cn("flex items-center gap-3 px-2 py-2 hover:bg-surface-2", sp.mission === r.missionId && "bg-surface-3")}
                        >
                          <ScorePill score={r.score} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{r.missionName}</span>
                            <span className="block truncate text-[11px] text-dim">
                              {r.matched.length ? r.matched.map((m) => m.skillName).join(" · ") : "No matching skills"}
                            </span>
                          </span>
                          <span className={cn("tabular font-mono text-[10px]", r.capacity > 0 && r.assigned >= r.capacity ? "text-gold" : "text-dim")}>
                            {r.assigned}/{r.capacity || "—"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </Panel>

                <Panel title={selected.assignments.length ? "Current assignment" : "Assign"} className={selected.assignments.length ? "border-green/30" : undefined}>
                  {selected.assignments.length > 0 ? (
                    <div className="space-y-4">
                      {selected.assignments.map((a) => (
                        <div key={a.id} className="border border-line bg-bg p-3">
                          <p className="font-display text-lg font-extrabold uppercase [font-stretch:112%]">{a.mission.name}</p>
                          <p className="text-sm text-muted">
                            {a.team.name}
                            {a.isLead && <span className="text-green"> · Team leader</span>}
                            {a.subRole && <> · {a.subRole}</>}
                          </p>
                        </div>
                      ))}
                      <AssignmentControls
                        candidateId={selected.id}
                        candidateName={selected.fullName}
                        selected
                        active={selected.assignments.map((a) => ({ id: a.id, missionName: a.mission.name, teamName: a.team.name, subRole: a.subRole, isLead: a.isLead, notes: a.notes }))}
                        missions={assignMissionOptions(selectedRecs)}
                        teams={teams}
                        canAddMore={settings.allowMultipleAssignments}
                      />
                    </div>
                  ) : (
                    <AssignForm
                      key={`${selected.id}-${sp.mission ?? ""}`}
                      candidateId={selected.id}
                      candidateName={selected.fullName}
                      missions={assignMissionOptions(selectedRecs)}
                      teams={teams}
                      defaultMissionId={sp.mission ?? (selectedRecs[0]?.score ? selectedRecs[0].missionId : undefined)}
                    />
                  )}
                </Panel>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Who is assigned where — grouped by team. */
async function TeamBoard() {
  const teams = await db.team.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      capacity: true,
      assignments: {
        where: { active: true },
        orderBy: [{ isLead: "desc" }, { candidate: { fullName: "asc" } }],
        select: { id: true, isLead: true, subRole: true, mission: { select: { name: true } }, candidate: { select: { id: true, fullName: true } } },
      },
    },
  });
  return (
    <Panel title="Who is assigned where" bodyClassName="p-0">
      <div className="grid gap-px bg-line md:grid-cols-2 2xl:grid-cols-3">
        {teams.map((t) => (
          <div key={t.id} className="bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">{t.name}</p>
              <span className={cn("tabular font-mono text-xs", t.capacity > 0 && t.assignments.length > t.capacity ? "text-danger" : "text-muted")}>
                {t.assignments.length}/{t.capacity || "—"}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {t.assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/admin/assignments?view=assigned&candidate=${a.candidate.id}`} className="truncate hover:text-azure">
                    {a.candidate.fullName}
                    {a.isLead && <span className="ml-1.5 font-mono text-[10px] text-green">LEAD</span>}
                  </Link>
                  <span className="truncate text-xs text-dim">{a.subRole ?? a.mission.name}</span>
                </li>
              ))}
              {t.assignments.length === 0 && <li className="text-xs text-dim">Nobody yet.</li>}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
