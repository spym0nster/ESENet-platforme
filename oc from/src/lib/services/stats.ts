import "server-only";
import { db } from "@/lib/db";

export async function dashboardStats() {
  const [byStatus, total, availability, assignedCount, selectedUnassigned, teams, missions, recent, activity] = await Promise.all([
    db.candidate.groupBy({ by: ["status"], _count: { _all: true } }),
    db.candidate.count(),
    db.candidate.count({ where: { availabilityConfirmed: true } }),
    db.candidate.count({ where: { assignments: { some: { active: true } } } }),
    db.candidate.count({ where: { status: "SELECTED", assignments: { none: { active: true } } } }),
    db.team.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, capacity: true, _count: { select: { assignments: { where: { active: true } } } } },
    }),
    db.mission.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, capacity: true, _count: { select: { assignments: { where: { active: true } } } } },
    }),
    db.candidate.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, fullName: true, applicationId: true, status: true, createdAt: true, specialization: true, isDemo: true },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      where: { action: { not: "user.login" } },
      select: { id: true, summary: true, createdAt: true, action: true, user: { select: { name: true } } },
    }),
  ]);

  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;

  return {
    total,
    pending: count("PENDING"),
    shortlisted: count("SHORTLISTED"),
    selected: count("SELECTED"),
    waitlist: count("WAITLIST"),
    rejected: count("REJECTED"),
    assigned: assignedCount,
    unassigned: selectedUnassigned,
    availabilityConfirmed: availability,
    teams: teams.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, used: t._count.assignments })),
    missions: missions.map((m) => ({ id: m.id, name: m.name, capacity: m.capacity, used: m._count.assignments })),
    recent,
    activity,
  };
}
