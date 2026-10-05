import "server-only";
import type { OperationalDay } from "@/generated/prisma/enums";
import { DAY_LABEL, DAY_ORDER, DAY_SLUG } from "@/lib/constants";
import { db } from "@/lib/db";

/** The three operational days, always in J-2 → J-1 → JOUR J order (created if the seed hasn't run). */
export async function getDays() {
  const rows = await db.scheduleDay.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return DAY_ORDER.map((key) => byKey.get(key) ?? { id: null, key, label: DAY_LABEL[key], title: DAY_LABEL[key], date: null, notes: null });
}

export function dayFromSlug(slug: string | undefined): OperationalDay | null {
  return (Object.entries(DAY_SLUG).find(([, s]) => s === slug)?.[0] as OperationalDay | undefined) ?? null;
}

/** Today's date in Tunisia as YYYY-MM-DD. */
export function tunisToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Current time in Tunisia as HH:MM. */
export function tunisNow(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Tunis", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}

/**
 * Which operational day is "now": the admin override from Settings if set, otherwise the day whose
 * configured date is today (Tunis time). Null outside the operational period.
 */
export function resolveCurrentDay(
  days: { key: OperationalDay; date: Date | null }[],
  override: OperationalDay | null,
  now = new Date(),
): { key: OperationalDay | null; source: "override" | "date" | "none" } {
  if (override) return { key: override, source: "override" };
  const today = tunisToday(now);
  const match = days.find((d) => d.date && d.date.toISOString().slice(0, 10) === today);
  return match ? { key: match.key, source: "date" } : { key: null, source: "none" };
}

export function formatDayDate(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}
