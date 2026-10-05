"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanMultiline, cleanText } from "@/lib/utils";

const optionalId = z.string().max(64).optional().nullable();

/* ── Teams ─────────────────────────────────────────────────── */

const teamSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(2, "Name is required.").max(80),
  description: z.string().trim().max(500).optional().default(""),
  capacity: z.coerce.number().int("Whole number.").min(0, "Can't be negative.").max(500),
  supervisorId: optionalId,
  active: z.boolean().default(true),
});
export type TeamInput = z.input<typeof teamSchema>;

export async function saveTeam(input: TeamInput): Promise<ActionResult> {
  return guarded("saveTeam", async () => {
    const user = await actor({ admin: true });
    const parsed = teamSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const data = {
      name: cleanText(d.name),
      description: d.description ? cleanMultiline(d.description) : null,
      capacity: d.capacity,
      supervisorId: d.supervisorId || null,
      active: d.active,
    };

    try {
      await db.$transaction(async (tx) => {
        if (d.id) {
          const prev = await tx.team.findUniqueOrThrow({ where: { id: d.id }, select: { name: true, description: true, capacity: true, supervisorId: true, active: true } });
          await tx.team.update({ where: { id: d.id }, data });
          await audit({ userId: user.id, action: "team.updated", targetType: "team", targetId: d.id, summary: `Team “${data.name}” updated`, previous: prev, next: data }, tx);
        } else {
          const max = await tx.team.aggregate({ _max: { sortOrder: true } });
          const t = await tx.team.create({ data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
          await audit({ userId: user.id, action: "team.created", targetType: "team", targetId: t.id, summary: `Team “${data.name}” created`, next: data }, tx);
        }
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { ok: false, error: "A team with this name already exists.", fieldErrors: { name: "Already used." } };
      }
      throw err;
    }
    revalidatePath("/admin", "layout");
    return { ok: true, message: d.id ? "Team updated" : "Team created" };
  });
}

/* ── Missions ──────────────────────────────────────────────── */

const missionSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(2, "Name is required.").max(80),
  description: z.string().trim().max(500).optional().default(""),
  capacity: z.coerce.number().int("Whole number.").min(0, "Can't be negative.").max(500),
  teamId: optionalId,
  active: z.boolean().default(true),
  /** skillId → weight (1 useful, 2 core, 3 critical). Skills not listed are not recommended. */
  skills: z.array(z.object({ skillId: z.string().min(1).max(64), weight: z.number().int().min(1).max(3) })).max(30),
});
export type MissionInput = z.input<typeof missionSchema>;

export async function saveMission(input: MissionInput): Promise<ActionResult> {
  return guarded("saveMission", async () => {
    const user = await actor({ admin: true });
    const parsed = missionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const uniqueSkills = [...new Map(d.skills.map((s) => [s.skillId, s])).values()];

    const known = await db.skill.count({ where: { id: { in: uniqueSkills.map((s) => s.skillId) } } });
    if (known !== uniqueSkills.length) return { ok: false, error: "One of the skills no longer exists. Refresh and try again." };

    const data = {
      name: cleanText(d.name),
      description: d.description ? cleanMultiline(d.description) : null,
      capacity: d.capacity,
      teamId: d.teamId || null,
      active: d.active,
    };

    try {
      await db.$transaction(async (tx) => {
        if (d.id) {
          const prev = await tx.mission.findUniqueOrThrow({
            where: { id: d.id },
            select: { name: true, description: true, capacity: true, teamId: true, active: true, skills: { select: { skillId: true, weight: true } } },
          });
          await tx.mission.update({ where: { id: d.id }, data });
          await tx.missionSkill.deleteMany({ where: { missionId: d.id } });
          if (uniqueSkills.length) await tx.missionSkill.createMany({ data: uniqueSkills.map((s) => ({ missionId: d.id!, ...s })) });
          await audit(
            { userId: user.id, action: "mission.updated", targetType: "mission", targetId: d.id, summary: `Mission “${data.name}” updated`, previous: prev, next: { ...data, skills: uniqueSkills } },
            tx,
          );
        } else {
          const max = await tx.mission.aggregate({ _max: { sortOrder: true } });
          const m = await tx.mission.create({
            data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 1, skills: { create: uniqueSkills } },
          });
          await audit({ userId: user.id, action: "mission.created", targetType: "mission", targetId: m.id, summary: `Mission “${data.name}” created`, next: { ...data, skills: uniqueSkills } }, tx);
        }
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { ok: false, error: "A mission with this name already exists.", fieldErrors: { name: "Already used." } };
      }
      throw err;
    }
    revalidatePath("/admin", "layout");
    return { ok: true, message: d.id ? "Mission updated" : "Mission created" };
  });
}
