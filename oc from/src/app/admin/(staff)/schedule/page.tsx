import { MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DayDialog, DeleteScheduleItem, ScheduleItemDialog } from "@/components/admin/schedule-forms";
import { EmptyState, PageHeader, Tag } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { DAY_LABEL, DAY_SLUG } from "@/lib/constants";
import { db } from "@/lib/db";
import { dayFromSlug, formatDayDate, getDays, resolveCurrentDay } from "@/lib/services/days";
import { getSettings } from "@/lib/services/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const [days, settings] = await Promise.all([getDays(), getSettings()]);
  const current = resolveCurrentDay(days, settings.currentDayOverride);
  const dayKey = dayFromSlug(sp.day) ?? current.key ?? "J_MINUS_2";
  const day = days.find((d) => d.key === dayKey)!;

  const [items, missions, teams, members] = await Promise.all([
    day.id
      ? db.scheduleItem.findMany({
          where: { dayId: day.id },
          orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
          include: {
            mission: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
            people: { include: { candidate: { select: { id: true, fullName: true } } } },
          },
        })
      : Promise.resolve([]),
    db.mission.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.team.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.candidate.findMany({ where: { status: "SELECTED" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
  ]);
  const memberOpts = members.map((m) => ({ id: m.id, name: m.fullName }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operational planning"
        title="Schedule"
        description="Every selected OC member works all three days. Plan who does what, when and where."
        actions={<ScheduleItemDialog day={dayKey} missions={missions} teams={teams} members={memberOpts} />}
      />

      <nav aria-label="Operational days" className="grid grid-cols-3 gap-px border border-line bg-line">
        {days.map((d) => {
          const active = d.key === dayKey;
          return (
            <Link
              key={d.key}
              href={`/admin/schedule?day=${DAY_SLUG[d.key]}`}
              aria-current={active ? "page" : undefined}
              className={cn("relative bg-surface px-3 py-4 text-center transition-colors sm:px-5 sm:text-left", active ? "bg-surface-3" : "hover:bg-surface-2")}
            >
              {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-brand" aria-hidden />}
              <span className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="font-display text-xl font-extrabold uppercase [font-stretch:112%] sm:text-3xl">{DAY_LABEL[d.key]}</span>
                {current.key === d.key && <span className="size-2 rounded-full bg-green" title="Today" />}
              </span>
              <span className="mt-1 hidden truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:block">{d.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg font-extrabold uppercase [font-stretch:112%]">{day.title}</p>
          <p className="text-sm text-muted">{formatDayDate(day.date) ?? "Date not set — an admin can set it in Settings."}</p>
          {day.notes && <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed">{day.notes}</p>}
        </div>
        <DayDialog day={dayKey} title={day.title} notes={day.notes ?? ""} />
      </div>

      {items.length === 0 ? (
        <EmptyState title={`Nothing planned for ${DAY_LABEL[dayKey]} yet`}>
          Add time slots with a mission, team, responsible people, location and notes. Nothing is pre-filled — the plan is yours.
        </EmptyState>
      ) : (
        <ol className="relative space-y-3 border-l border-line-strong pl-5 sm:pl-8">
          {items.map((it) => (
            <li key={it.id} className="relative">
              <span className="absolute -left-[25px] top-5 size-2.5 rounded-full border border-azure bg-bg sm:-left-[37px]" aria-hidden />
              <article className="grid gap-3 border border-line bg-surface p-4 sm:grid-cols-[120px_1fr_auto] sm:gap-6">
                <p className="tabular font-mono text-lg text-azure">
                  {it.startTime}
                  {it.endTime && <span className="block text-sm text-dim">→ {it.endTime}</span>}
                </p>
                <div className="min-w-0 space-y-2">
                  <h3 className="font-semibold">{it.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {it.mission && <Tag className="border-azure/40 text-azure">{it.mission.name}</Tag>}
                    {it.team && <Tag>{it.team.name}</Tag>}
                    {it.location && (
                      <span className="inline-flex h-6 items-center gap-1 text-xs text-muted">
                        <MapPin className="size-3.5" /> {it.location}
                      </span>
                    )}
                  </div>
                  {it.people.length > 0 && (
                    <p className="flex items-start gap-2 text-sm text-muted">
                      <Users className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {it.people.map((p, i) => (
                          <span key={p.candidateId}>
                            {i > 0 && ", "}
                            <Link href={`/admin/candidates/${p.candidate.id}`} className="hover:text-azure">{p.candidate.fullName}</Link>
                          </span>
                        ))}
                      </span>
                    </p>
                  )}
                  {it.notes && <p className="whitespace-pre-line text-sm text-muted">{it.notes}</p>}
                </div>
                <div className="flex gap-1 sm:flex-col">
                  <ScheduleItemDialog
                    day={dayKey}
                    missions={missions}
                    teams={teams}
                    members={memberOpts}
                    item={{
                      id: it.id,
                      startTime: it.startTime,
                      endTime: it.endTime ?? "",
                      title: it.title,
                      location: it.location ?? "",
                      notes: it.notes ?? "",
                      missionId: it.missionId,
                      teamId: it.teamId,
                      people: it.people.map((p) => p.candidateId),
                    }}
                  />
                  <DeleteScheduleItem id={it.id} title={it.title} />
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
