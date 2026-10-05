"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoreMission } from "@/lib/matching";
import { cleanMultiline, cleanText } from "@/lib/utils";

const assignSchema = z.object({
  candidateId: z.string().min(1).max(64),
  missionId: z.string().min(1, "Choose a mission.").max(64),
  teamId: z.string().min(1, "Choose a team.").max(64),
  subRole: z.string().trim().max(120, "Keep the role under 120 characters.").optional().default(""),
  isLead: z.boolean().default(false),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters.").optional().default(""),
  /** When set, this active assignment is ended and replaced (reassignment). */
  replaceAssignmentId: z.string().max(64).optional().nullable(),
});

export type AssignInput = z.input<typeof assignSchema>;

/**
 * Create an assignment, or reassign (end the previous one and link the new one to it).
 * Runs under a row lock on the candidate so two Ambassadors can't double-assign the same person.
 */
export async function assignCandidate(input: AssignInput): Promise<ActionResult<{ assignmentId: string }>> {
  return guarded<{ assignmentId: string }>("assignCandidate", async () => {
    const user = await actor();
    const parsed = assignSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;

    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Candidate" WHERE id = ${d.candidateId} FOR UPDATE`;

      // Sequential on purpose: an interactive transaction holds a single connection.
      const candidate = await tx.candidate.findUnique({
        where: { id: d.candidateId },
        select: { id: true, fullName: true, status: true, eventExperience: true, ambassadorExperience: true, skills: { select: { skillId: true } } },
      });
      const mission = await tx.mission.findUnique({
        where: { id: d.missionId },
        select: { id: true, name: true, active: true, capacity: true, skills: { select: { weight: true, skill: { select: { id: true, name: true } } } } },
      });
      const team = await tx.team.findUnique({ where: { id: d.teamId }, select: { id: true, name: true, active: true, capacity: true } });
      const settings = await tx.appSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

      if (!candidate) return { error: "This candidate no longer exists." } as const;
      if (candidate.status !== "SELECTED") return { error: "Only selected candidates can be assigned. Select them first." } as const;
      if (!mission || !mission.active) return { error: "That mission is not active." } as const;
      if (!team || !team.active) return { error: "That team is not active." } as const;

      const active = await tx.assignment.findMany({
        where: { candidateId: d.candidateId, active: true },
        select: { id: true, subRole: true, isLead: true, mission: { select: { id: true, name: true } }, team: { select: { id: true, name: true } } },
      });

      const replacing = d.replaceAssignmentId ? active.find((a) => a.id === d.replaceAssignmentId) : undefined;
      if (d.replaceAssignmentId && !replacing) {
        return { error: "That assignment was already changed by someone else. Refresh and try again." } as const;
      }
      const others = active.filter((a) => a.id !== replacing?.id);
      if (others.length && !settings.allowMultipleAssignments) {
        return { error: `${candidate.fullName} is already assigned to ${others[0]!.mission.name}. Use “Reassign” to change it.` } as const;
      }
      if (others.some((a) => a.mission.id === mission.id)) {
        return { error: `${candidate.fullName} is already active on ${mission.name}.` } as const;
      }

      const score = scoreMission(
        { skillIds: candidate.skills.map((s) => s.skillId), eventExperience: candidate.eventExperience, ambassadorExperience: candidate.ambassadorExperience },
        { id: mission.id, name: mission.name, skills: mission.skills.map((s) => ({ skillId: s.skill.id, skillName: s.skill.name, weight: s.weight })) },
      ).score;

      if (replacing) {
        await tx.assignment.update({
          where: { id: replacing.id },
          data: { active: false, endedAt: new Date(), endedById: user.id, endReason: "Reassigned" },
        });
      }

      const created = await tx.assignment.create({
        data: {
          candidateId: candidate.id,
          missionId: mission.id,
          teamId: team.id,
          subRole: d.subRole ? cleanText(d.subRole) : null,
          isLead: d.isLead,
          notes: d.notes ? cleanMultiline(d.notes) : null,
          scoreAtAssignment: score,
          assignedById: user.id,
          previousAssignmentId: replacing?.id ?? null,
        },
      });

      const next = { mission: mission.name, team: team.name, subRole: created.subRole, isLead: created.isLead, score };
      await audit(
        {
          userId: user.id,
          action: replacing ? "assignment.reassigned" : "assignment.created",
          targetType: "assignment",
          targetId: created.id,
          summary: replacing
            ? `${candidate.fullName} reassigned: ${replacing.mission.name} / ${replacing.team.name} → ${mission.name} / ${team.name}`
            : `${candidate.fullName} assigned to ${mission.name} / ${team.name}`,
          previous: replacing
            ? { assignmentId: replacing.id, mission: replacing.mission.name, team: replacing.team.name, subRole: replacing.subRole, isLead: replacing.isLead }
            : null,
          next: { candidateId: candidate.id, ...next },
        },
        tx,
      );

      const teamUsed = await tx.assignment.count({ where: { teamId: team.id, active: true } });
      const missionUsed = await tx.assignment.count({ where: { missionId: mission.id, active: true } });
      const warnings = [
        team.capacity > 0 && teamUsed > team.capacity ? `${team.name} is over capacity (${teamUsed}/${team.capacity})` : null,
        mission.capacity > 0 && missionUsed > mission.capacity ? `${mission.name} is over capacity (${missionUsed}/${mission.capacity})` : null,
      ].filter(Boolean);

      return { id: created.id, name: candidate.fullName, mission: mission.name, warnings, replaced: Boolean(replacing) } as const;
    });

    if ("error" in result) return { ok: false, error: result.error! };
    revalidatePath("/admin", "layout");
    const base = `${result.name} ${result.replaced ? "reassigned" : "assigned"} to ${result.mission}`;
    return {
      ok: true,
      data: { assignmentId: result.id },
      message: result.warnings.length ? `${base}. Note: ${result.warnings.join("; ")}.` : base,
    };
  });
}

/** Edit role / lead flag / notes in place. Mission or team changes go through reassignment instead. */
export async function updateAssignmentDetails(input: { assignmentId: string; subRole: string; isLead: boolean; notes: string }): Promise<ActionResult> {
  return guarded("updateAssignmentDetails", async () => {
    const user = await actor();
    const parsed = z
      .object({ assignmentId: z.string().min(1).max(64), subRole: z.string().trim().max(120), isLead: z.boolean(), notes: z.string().trim().max(1000) })
      .safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;

    const res = await db.$transaction(async (tx) => {
      const a = await tx.assignment.findUnique({
        where: { id: d.assignmentId },
        select: { active: true, subRole: true, isLead: true, notes: true, candidate: { select: { fullName: true } } },
      });
      if (!a || !a.active) return false;
      const next = { subRole: d.subRole ? cleanText(d.subRole) : null, isLead: d.isLead, notes: d.notes ? cleanMultiline(d.notes) : null };
      await tx.assignment.update({ where: { id: d.assignmentId }, data: next });
      await audit(
        {
          userId: user.id,
          action: "assignment.updated",
          targetType: "assignment",
          targetId: d.assignmentId,
          summary: `Assignment details updated for ${a.candidate.fullName}`,
          previous: { subRole: a.subRole, isLead: a.isLead, notes: a.notes },
          next,
        },
        tx,
      );
      return true;
    });
    if (!res) return { ok: false, error: "This assignment is no longer active. Refresh the page." };
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Assignment updated" };
  });
}

/** End an assignment (the person becomes unassigned). History is kept. */
export async function endAssignment(assignmentId: string, reason: string): Promise<ActionResult> {
  return guarded("endAssignment", async () => {
    const user = await actor();
    const parsed = z.object({ id: z.string().min(1).max(64), reason: z.string().trim().max(300) }).safeParse({ id: assignmentId, reason });
    if (!parsed.success) return invalid(parsed.error);

    const res = await db.$transaction(async (tx) => {
      const a = await tx.assignment.findUnique({
        where: { id: assignmentId },
        select: { active: true, candidate: { select: { fullName: true } }, mission: { select: { name: true } }, team: { select: { name: true } } },
      });
      if (!a || !a.active) return false;
      await tx.assignment.update({
        where: { id: assignmentId },
        data: { active: false, endedAt: new Date(), endedById: user.id, endReason: parsed.data.reason || "Unassigned" },
      });
      await audit(
        {
          userId: user.id,
          action: "assignment.ended",
          targetType: "assignment",
          targetId: assignmentId,
          summary: `${a.candidate.fullName} unassigned from ${a.mission.name} / ${a.team.name}`,
          previous: { mission: a.mission.name, team: a.team.name, active: true },
          next: { active: false, reason: parsed.data.reason || "Unassigned" },
        },
        tx,
      );
      return true;
    });
    if (!res) return { ok: false, error: "This assignment is no longer active." };
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Assignment ended" };
  });
}
