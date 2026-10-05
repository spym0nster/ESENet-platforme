import "server-only";
import { db } from "@/lib/db";
import { rankMissions, type MatchCandidate, type MatchMission, type MissionMatch } from "@/lib/matching";

/** Active missions in the shape the matching algorithm expects, plus live capacity usage. */
export async function loadMatchMissions() {
  const missions = await db.mission.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sortOrder: true,
      capacity: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      skills: { select: { weight: true, skill: { select: { id: true, name: true } } } },
      _count: { select: { assignments: { where: { active: true } } } },
    },
  });
  return missions.map((m) => ({
    id: m.id,
    name: m.name,
    sortOrder: m.sortOrder,
    capacity: m.capacity,
    assigned: m._count.assignments,
    team: m.team,
    skills: m.skills.map((s) => ({ skillId: s.skill.id, skillName: s.skill.name, weight: s.weight })),
  }));
}

export type LoadedMission = Awaited<ReturnType<typeof loadMatchMissions>>[number];

export type Recommendation = MissionMatch & { capacity: number; assigned: number; teamId: string | null; teamName: string | null };

/** Active teams with live seat usage, for assignment pickers. */
export async function loadTeamOptions() {
  const teams = await db.team.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, capacity: true, _count: { select: { assignments: { where: { active: true } } } } },
  });
  return teams.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, used: t._count.assignments }));
}

/** Missions for the assign form: ranked for this candidate, with their default team and usage. */
export function assignMissionOptions(recs: Recommendation[]) {
  return recs.map((r) => ({ id: r.missionId, name: r.missionName, score: r.score, capacity: r.capacity, assigned: r.assigned, teamId: r.teamId }));
}

export function recommend(candidate: MatchCandidate, missions: LoadedMission[]): Recommendation[] {
  const byId = new Map(missions.map((m) => [m.id, m]));
  return rankMissions(candidate, missions as MatchMission[]).map((r) => {
    const m = byId.get(r.missionId)!;
    return { ...r, capacity: m.capacity, assigned: m.assigned, teamId: m.team?.id ?? null, teamName: m.team?.name ?? null };
  });
}
