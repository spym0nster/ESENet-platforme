import type { Metadata } from "next";
import { DayDates, NewStaffDialog, PlatformSettings, SkillsManager, StaffRowControls } from "@/components/admin/settings-forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import type { OperationalDay } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { getDays } from "@/lib/services/days";
import { getSettings } from "@/lib/services/settings";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const [settings, days, staff, skills] = await Promise.all([
    getSettings(),
    getDays(),
    db.user.findMany({ orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }], select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true } }),
    db.skill.findMany({ orderBy: [{ isOther: "asc" }, { sortOrder: "asc" }], include: { _count: { select: { candidates: true } } } }),
  ]);

  const dates = Object.fromEntries(days.map((d) => [d.key, d.date ? d.date.toISOString().slice(0, 10) : ""])) as Record<OperationalDay, string>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Settings" description="Application window, assignment rules, operational dates, staff accounts and skills." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Platform">
          <PlatformSettings
            initial={{ applicationsOpen: settings.applicationsOpen, allowMultipleAssignments: settings.allowMultipleAssignments, currentDayOverride: settings.currentDayOverride }}
          />
        </Panel>

        <div className="space-y-6">
          <Panel title="Operational dates" eyebrow="J-2 · J-1 · Jour J">
            <DayDates initial={dates} />
          </Panel>
          <Panel title="Integrations">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                CV upload (Vercel Blob, private)
                <span className={cn("font-mono text-xs", features.cvUpload ? "text-green" : "text-dim")}>{features.cvUpload ? "Configured" : "Not configured"}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                Confirmation email (SMTP)
                <span className={cn("font-mono text-xs", features.email ? "text-green" : "text-dim")}>{features.email ? "Configured" : "Not configured"}</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-dim">Set via environment variables — see README. Both are optional; the platform works without them.</p>
          </Panel>
        </div>
      </div>

      <Panel title="Staff accounts" actions={<NewStaffDialog />} bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {staff.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className={cn("font-medium", !u.active && "text-dim line-through")}>
                  {u.name} {u.id === me.id && <span className="ml-1 font-mono text-[10px] text-azure">YOU</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {u.email} · {u.lastLoginAt ? `last sign-in ${formatDateTime(u.lastLoginAt)}` : "never signed in"}
                </p>
              </div>
              <StaffRowControls id={u.id} name={u.name} role={u.role} active={u.active} self={u.id === me.id} />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Skills on the application form">
        <SkillsManager skills={skills.map((s) => ({ id: s.id, name: s.name, active: s.active, isOther: s.isOther, used: s._count.candidates }))} />
      </Panel>
    </div>
  );
}
