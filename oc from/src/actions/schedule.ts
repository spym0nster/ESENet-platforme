"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OperationalDay } from "@/generated/prisma/enums";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { DAY_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { cleanMultiline, cleanText } from "@/lib/utils";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h).");

const itemSchema = z
  .object({
    id: z.string().max(64).optional().nullable(),
    day: z.enum(OperationalDay),
    startTime: time,
    endTime: time.or(z.literal("")).optional().default(""),
    title: z.string().trim().min(2, "Give it a title.").max(120),
    location: z.string().trim().max(120).optional().default(""),
    notes: z.string().trim().max(1000).optional().default(""),
    missionId: z.string().max(64).optional().nullable(),
    teamId: z.string().max(64).optional().nullable(),
    people: z.array(z.string().min(1).max(64)).max(60).default([]),
  })
  .refine((v) => !v.endTime || v.endTime > v.startTime, { path: ["endTime"], message: "Must be after the start time." });

export type ScheduleItemInput = z.input<typeof itemSchema>;

export async function saveScheduleItem(input: ScheduleItemInput): Promise<ActionResult> {
  return guarded("saveScheduleItem", async () => {
    const user = await actor();
    const parsed = itemSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;

    const day = await db.scheduleDay.upsert({
      where: { key: d.day },
      update: {},
      create: { key: d.day, label: DAY_LABEL[d.day], title: DAY_LABEL[d.day] },
    });
    const people = [...new Set(d.people)];
    if (people.length) {
      const n = await db.candidate.count({ where: { id: { in: people }, status: "SELECTED" } });
      if (n !== people.length) return { ok: false, error: "Responsible people must be selected OC members." };
    }

    const data = {
      dayId: day.id,
      startTime: d.startTime,
      endTime: d.endTime || null,
      title: cleanText(d.title),
      location: d.location ? cleanText(d.location) : null,
      notes: d.notes ? cleanMultiline(d.notes) : null,
      missionId: d.missionId || null,
      teamId: d.teamId || null,
    };

    await db.$transaction(async (tx) => {
      if (d.id) {
        const prev = await tx.scheduleItem.findUniqueOrThrow({ where: { id: d.id }, include: { people: { select: { candidateId: true } } } });
        await tx.scheduleItem.update({ where: { id: d.id }, data });
        await tx.scheduleItemPerson.deleteMany({ where: { itemId: d.id } });
        if (people.length) await tx.scheduleItemPerson.createMany({ data: people.map((candidateId) => ({ itemId: d.id!, candidateId })) });
        await audit(
          {
            userId: user.id,
            action: "schedule.item_updated",
            targetType: "schedule",
            targetId: d.id,
            summary: `${DAY_LABEL[d.day]} ${data.startTime} “${data.title}” updated`,
            previous: { startTime: prev.startTime, endTime: prev.endTime, title: prev.title, location: prev.location, missionId: prev.missionId, teamId: prev.teamId, people: prev.people.map((p) => p.candidateId) },
            next: { ...data, people },
          },
          tx,
        );
      } else {
        const item = await tx.scheduleItem.create({ data: { ...data, people: { create: people.map((candidateId) => ({ candidateId })) } } });
        await audit(
          { userId: user.id, action: "schedule.item_created", targetType: "schedule", targetId: item.id, summary: `${DAY_LABEL[d.day]} ${data.startTime} “${data.title}” added`, next: { ...data, people } },
          tx,
        );
      }
    });
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/operations");
    return { ok: true, message: d.id ? "Schedule item updated" : "Schedule item added" };
  });
}

export async function deleteScheduleItem(id: string): Promise<ActionResult> {
  return guarded("deleteScheduleItem", async () => {
    const user = await actor();
    if (!z.string().min(1).max(64).safeParse(id).success) return { ok: false, error: "Invalid item." };
    const done = await db.$transaction(async (tx) => {
      const prev = await tx.scheduleItem.findUnique({ where: { id }, include: { day: true, people: { select: { candidateId: true } } } });
      if (!prev) return false;
      await tx.scheduleItem.delete({ where: { id } });
      await audit(
        {
          userId: user.id,
          action: "schedule.item_deleted",
          targetType: "schedule",
          targetId: id,
          summary: `${prev.day.label} ${prev.startTime} “${prev.title}” removed`,
          previous: { day: prev.day.key, startTime: prev.startTime, endTime: prev.endTime, title: prev.title, location: prev.location, notes: prev.notes, missionId: prev.missionId, teamId: prev.teamId, people: prev.people.map((p) => p.candidateId) },
        },
        tx,
      );
      return true;
    });
    if (!done) return { ok: false, error: "This item was already removed." };
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/operations");
    return { ok: true, message: "Schedule item removed" };
  });
}

const daySchema = z.object({
  day: z.enum(OperationalDay),
  title: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function saveScheduleDay(input: z.input<typeof daySchema>): Promise<ActionResult> {
  return guarded("saveScheduleDay", async () => {
    const user = await actor();
    const parsed = daySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    await db.$transaction(async (tx) => {
      const prev = await tx.scheduleDay.findUnique({ where: { key: d.day } });
      const next = { title: cleanText(d.title), notes: d.notes ? cleanMultiline(d.notes) : null };
      await tx.scheduleDay.upsert({ where: { key: d.day }, update: next, create: { key: d.day, label: DAY_LABEL[d.day], ...next } });
      await audit(
        { userId: user.id, action: "schedule.day_updated", targetType: "schedule", targetId: prev?.id ?? null, summary: `${DAY_LABEL[d.day]} details updated`, previous: prev ? { title: prev.title, notes: prev.notes } : null, next },
        tx,
      );
    });
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/operations");
    return { ok: true, message: "Day updated" };
  });
}
