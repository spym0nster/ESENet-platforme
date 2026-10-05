/**
 * Mission recommendation — deterministic skill matching (no AI, no external API).
 *
 * Every mission has a list of recommended skills, each with a weight:
 *   2 = core skill for the mission, 1 = useful skill (3 is allowed for "critical").
 *
 * For a candidate C and a mission M:
 *
 *   totalWeight   = Σ weight of all of M's skills
 *   matchedWeight = Σ weight of M's skills that C ticked
 *   target        = SATURATION × totalWeight
 *       Nobody is expected to have *every* skill a mission lists, so a candidate who covers
 *       SATURATION (60%) of the weighted skill set counts as a full skill fit.
 *   skillFit      = min(1, matchedWeight / target)                        ∈ [0, 1]
 *
 *   experience    = 0.6 if C has organised events before
 *                 + 0.4 if C has taken part in ESEN / Ambassadors / ESENet activities   ∈ [0, 1]
 *
 *   score         = round(100 × (SKILL_SHARE × skillFit + EXPERIENCE_SHARE × experience))
 *                   with SKILL_SHARE = 0.85, EXPERIENCE_SHARE = 0.15
 *
 * A candidate with zero matching skills scores 0 for that mission regardless of experience —
 * experience only separates people who already fit. Ties are broken by more core-skill matches,
 * then by mission sort order, so the ranking is stable and reproducible.
 *
 * The score is a *recommendation*. Ambassadors make every assignment by hand.
 */

export const SATURATION = 0.6;
export const SKILL_SHARE = 0.85;
export const EXPERIENCE_SHARE = 0.15;

export type MatchCandidate = {
  skillIds: readonly string[];
  eventExperience: boolean;
  ambassadorExperience: boolean;
};

export type MatchMission = {
  id: string;
  name: string;
  sortOrder?: number;
  skills: readonly { skillId: string; skillName: string; weight: number }[];
};

export type MissionMatch = {
  missionId: string;
  missionName: string;
  score: number;
  matched: { skillId: string; skillName: string; weight: number }[];
  missing: { skillId: string; skillName: string; weight: number }[];
  coreMatched: number;
};

export function experienceFactor(c: Pick<MatchCandidate, "eventExperience" | "ambassadorExperience">) {
  return (c.eventExperience ? 0.6 : 0) + (c.ambassadorExperience ? 0.4 : 0);
}

export function scoreMission(candidate: MatchCandidate, mission: MatchMission): MissionMatch {
  const has = new Set(candidate.skillIds);
  const matched = mission.skills.filter((s) => has.has(s.skillId));
  const missing = mission.skills.filter((s) => !has.has(s.skillId));
  const totalWeight = mission.skills.reduce((sum, s) => sum + s.weight, 0);
  const matchedWeight = matched.reduce((sum, s) => sum + s.weight, 0);

  let score = 0;
  if (totalWeight > 0 && matchedWeight > 0) {
    const skillFit = Math.min(1, matchedWeight / (SATURATION * totalWeight));
    score = Math.round(100 * (SKILL_SHARE * skillFit + EXPERIENCE_SHARE * experienceFactor(candidate)));
  }

  return {
    missionId: mission.id,
    missionName: mission.name,
    score,
    matched: [...matched].sort((a, b) => b.weight - a.weight),
    missing: [...missing].sort((a, b) => b.weight - a.weight),
    coreMatched: matched.filter((s) => s.weight >= 2).length,
  };
}

/** All missions ranked for one candidate, best first. */
export function rankMissions(candidate: MatchCandidate, missions: readonly MatchMission[]): MissionMatch[] {
  const order = new Map(missions.map((m, i) => [m.id, m.sortOrder ?? i]));
  return missions
    .map((m) => scoreMission(candidate, m))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.coreMatched - a.coreMatched ||
        (order.get(a.missionId) ?? 0) - (order.get(b.missionId) ?? 0),
    );
}

/** Qualitative band for UI colouring. */
export function scoreBand(score: number): "strong" | "good" | "weak" | "none" {
  if (score >= 75) return "strong";
  if (score >= 50) return "good";
  if (score > 0) return "weak";
  return "none";
}
