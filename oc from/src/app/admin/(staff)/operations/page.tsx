import { MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh, NoteActions, NoteComposer } from "@/components/admin/operations-client";
import { CapacityBar, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { DAY_LABEL, DAY_SLUG } from "@/lib/constants";
import { db } from "@/lib/db";
import { dayFromSlug, formatDayDate, getDays, resolveCurrentDay, tunisNow } from "@/lib/services/days";
import { getSettings } from "@/lib/services/settings";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Operations" };

function Tel({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="tabular inline-flex items-center gap-1.5 font-mono text-sm text-azure hover:underline">
      <Phone className="size-3.5" /> {phone}
    </a>
  );
}

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const [days, settings] = await Promise.all([getDays(), getSettings()]);
  const current = resolveCurrentDay(days, settings.currentDayOverride);
  const viewKey = dayFromSlug(sp.day) ?? current.key ?? "J_MINUS_2";
  const day = days.find((d) => d.key === viewKey)!;
  const isToday = current.key === viewKey;
  const now = tunisNow();

  const [items, teams, missions, unassigned, toContact, notes] = await Promise.all([
    day.id
      ? db.scheduleItem.findMany({
          where: { dayId: day.id },
          orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
          include: { mission: { select: { name: true } }, team: { select: { name: true } }, people: { select: { candidate: { select: { fullName: true } } } } },
        })
      : Promise.resolve([]),
    db.team.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        capacity: true,
        supervisor: { select: { name: true } },
        assignments: {
          where: { active: true },
          select: { isLead: true, candidate: { select: { id: true, fullName: true, phone: true } } },
        },
      },
    }),
    db.mission.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, capacity: true, _count: { select: { assignments: { where: { active: true } } } } },
    }),
    db.candidate.findMany({
      where: { status: "SELECTED", assignments: { none: { active: true } } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, phone: true },
    }),
    db.candidate.findMany({
      where: { contactReason: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, fullName: true, phone: true, contactReason: true, status: true },
    }),
    db.operationsNote.findMany({
      where: { OR: [{ day: null }, { day: viewKey }] },
      orderBy: [{ resolvedAt: { sort: "asc", nulls: "first" } }, { pinned: "desc" }, { createdAt: "desc" }],
      take: 40,
      include: { author: { select: { name: true } } },
    }),
  ]);

  // Now / next only make sense when looking at today.
  const nowIdx = isToday ? items.findLastIndex((i) => i.startTime <= now && (!i.endTime || i.endTime > now)) : -1;
  const nextIdx = isToday ? items.findIndex((i) => i.startTime > now) : -1;
  const openNotes = notes.filter((n) => !n.resolvedAt);
  const doneNotes = notes.filter((n) => n.resolvedAt);

  return (
    <div className="space-y-6">
      {/* Day header */}
      <header className="flex flex-col gap-5 border-b border-line pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="eyebrow text-green">● Operations</p>
            <AutoRefresh />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <h1 className="display text-6xl uppercase sm:text-8xl">
              <span className={isToday ? "text-gradient" : undefined}>{DAY_LABEL[viewKey]}</span>
            </h1>
            <div>
              <p className="font-display text-xl font-extrabold uppercase [font-stretch:112%]">{day.title}</p>
              <p className="text-sm text-muted">
                {formatDayDate(day.date) ?? "Date not set"}
                {isToday ? (current.source === "override" ? " · current day (set by admin)" : " · today") : current.key ? ` · today is ${DAY_LABEL[current.key]}` : " · outside the operational period"}
              </p>
            </div>
          </div>
        </div>
        <nav aria-label="Switch day" className="grid grid-cols-3 gap-px border border-line bg-line">
          {days.map((d) => (
            <Link
              key={d.key}
              href={`/admin/operations?day=${DAY_SLUG[d.key]}`}
              aria-current={d.key === viewKey ? "page" : undefined}
              className={cn("bg-surface px-5 py-3 text-center font-mono text-sm tracking-[0.12em]", d.key === viewKey ? "bg-surface-3 text-text" : "text-muted hover:text-text")}
            >
              {DAY_LABEL[d.key]}
              {current.key === d.key && <span className="ml-1.5 text-green">●</span>}
            </Link>
          ))}
        </nav>
      </header>

      {day.notes && (
        <div className="border-l-2 border-azure bg-surface px-5 py-4">
          <p className="eyebrow">Day briefing</p>
          <p className="mt-2 whitespace-pre-line text-lg leading-relaxed">{day.notes}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Schedule */}
        <Panel title={`${DAY_LABEL[viewKey]} schedule`} actions={<Link href={`/admin/schedule?day=${DAY_SLUG[viewKey]}`} className="text-xs text-azure hover:underline">Edit</Link>} bodyClassName="p-0">
          {items.length === 0 ? (
            <p className="p-5 text-muted">No schedule for this day yet.</p>
          ) : (
            <ol className="divide-y divide-line">
              {items.map((it, i) => {
                const isNow = i === nowIdx;
                const isNext = i === nextIdx;
                // Finished: its end time has passed, or (no end time) a later slot has already started.
                const past = isToday && !isNow && (it.endTime ? it.endTime <= now : items.some((x, j) => j > i && x.startTime <= now));
                return (
                  <li key={it.id} className={cn("grid grid-cols-[84px_1fr] gap-4 px-4 py-4 sm:px-5", isNow && "bg-green/8", past && "opacity-50")}>
                    <p className="tabular font-mono text-xl text-azure">
                      {it.startTime}
                      {it.endTime && <span className="block text-xs text-dim">→ {it.endTime}</span>}
                    </p>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                        {it.title}
                        {isNow && <span className="border border-green/50 px-1.5 font-mono text-[10px] tracking-[0.14em] text-green">NOW</span>}
                        {isNext && <span className="border border-azure/50 px-1.5 font-mono text-[10px] tracking-[0.14em] text-azure">NEXT</span>}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {[it.mission?.name, it.team?.name].filter(Boolean).join(" · ")}
                        {it.location && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <MapPin className="size-3.5" /> {it.location}
                          </span>
                        )}
                      </p>
                      {it.people.length > 0 && <p className="mt-1 text-sm">{it.people.map((p) => p.candidate.fullName).join(", ")}</p>}
                      {it.notes && <p className="mt-1 whitespace-pre-line text-sm text-muted">{it.notes}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        {/* Notes */}
        <Panel title="Important notes" className={openNotes.some((n) => n.pinned) ? "border-gold/40" : undefined}>
          <NoteComposer day={viewKey} />
          <ul className="mt-4 space-y-2">
            {openNotes.map((n) => (
              <li key={n.id} className={cn("flex items-start justify-between gap-3 border p-3", n.pinned ? "border-gold/50 bg-gold/8" : "border-line bg-bg")}>
                <div className="min-w-0">
                  <p className="whitespace-pre-line text-base">{n.body}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                    {n.author?.name ?? "—"} · {formatDateTime(n.createdAt)}
                    {n.day ? ` · ${DAY_LABEL[n.day]}` : " · all days"}
                  </p>
                </div>
                <NoteActions id={n.id} pinned={n.pinned} resolved={false} />
              </li>
            ))}
            {openNotes.length === 0 && <li className="text-sm text-muted">No open notes.</li>}
          </ul>
          {doneNotes.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-muted">Resolved ({doneNotes.length})</summary>
              <ul className="mt-2 space-y-2">
                {doneNotes.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-3 border border-line p-3 opacity-60">
                    <p className="min-w-0 whitespace-pre-line text-sm line-through">{n.body}</p>
                    <NoteActions id={n.id} pinned={n.pinned} resolved />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Panel>
      </div>

      {/* Teams & leaders */}
      <Panel title="Teams & leaders" bodyClassName="p-0">
        <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => {
            const leads = t.assignments.filter((a) => a.isLead);
            return (
              <div key={t.id} className="space-y-3 bg-surface p-5">
                <CapacityBar used={t.assignments.length} capacity={t.capacity} label={t.name} large />
                <div>
                  <p className="eyebrow text-dim">Leader{leads.length === 1 ? "" : "s"}</p>
                  {leads.length === 0 ? (
                    <p className="mt-1 text-sm text-gold">No team leader assigned</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {leads.map((l) => (
                        <li key={l.candidate.id} className="flex flex-wrap items-center justify-between gap-2">
                          <Link href={`/admin/candidates/${l.candidate.id}`} className="text-base font-semibold hover:text-azure">{l.candidate.fullName}</Link>
                          <Tel phone={l.candidate.phone} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {t.supervisor && <p className="text-xs text-muted">Ambassador in charge: {t.supervisor.name}</p>}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Missions">
          <div className="space-y-4">
            {missions.map((m) => (
              <CapacityBar key={m.id} used={m._count.assignments} capacity={m.capacity} label={m.name} />
            ))}
          </div>
        </Panel>

        <Panel title={`Unassigned people (${unassigned.length})`} className={unassigned.length ? "border-gold/40" : undefined} bodyClassName="p-0">
          {unassigned.length === 0 ? (
            <p className="p-5 text-sm text-green">Every selected member has an assignment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {unassigned.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                  <Link href={`/admin/assignments?candidate=${c.id}`} className="font-medium hover:text-azure">{c.fullName}</Link>
                  <Tel phone={c.phone} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`People to contact (${toContact.length})`} bodyClassName="p-0">
          {toContact.length === 0 ? (
            <p className="p-5 text-sm text-muted">Nobody flagged. Flag people from their profile.</p>
          ) : (
            <ul className="divide-y divide-line">
              {toContact.map((c) => (
                <li key={c.id} className="space-y-1 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/admin/candidates/${c.id}`} className="font-medium hover:text-azure">{c.fullName}</Link>
                    <Tel phone={c.phone} />
                  </div>
                  <p className="text-sm text-gold">{c.contactReason}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
