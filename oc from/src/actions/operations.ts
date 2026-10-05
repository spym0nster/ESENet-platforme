"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OperationalDay } from "@/generated/prisma/enums";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanMultiline } from "@/lib/utils";

const noteSchema = z.object({
  body: z.string().trim().min(2, "Write a note.").max(1000),
  day: z.enum(OperationalDay).nullable().optional(),
  pinned: z.boolean().default(false),
});

export async function addOperationsNote(input: z.input<typeof noteSchema>): Promise<ActionResult> {
  return guarded("addOperationsNote", async () => {
    const user = await actor();
    const parsed = noteSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const body = cleanMultiline(parsed.data.body);
    await db.$transaction(async (tx) => {
      const n = await tx.operationsNote.create({ data: { body, day: parsed.data.day ?? null, pinned: parsed.data.pinned, authorId: user.id } });
      await audit({ userId: user.id, action: "note.created", targetType: "note", targetId: n.id, summary: `Operations note: ${body.slice(0, 80)}`, next: { body, day: n.day, pinned: n.pinned } }, tx);
    });
    revalidatePath("/admin/operations");
    return { ok: true, message: "Note added" };
  });
}

export async function updateOperationsNote(id: string, change: { pinned?: boolean; resolved?: boolean }): Promise<ActionResult> {
  return guarded("updateOperationsNote", async () => {
    const user = await actor();
    if (!z.string().min(1).max(64).safeParse(id).success) return { ok: false, error: "Invalid note." };
    const done = await db.$transaction(async (tx) => {
      const prev = await tx.operationsNote.findUnique({ where: { id } });
      if (!prev) return false;
      const data = {
        ...(change.pinned !== undefined ? { pinned: change.pinned } : {}),
        ...(change.resolved !== undefined ? { resolvedAt: change.resolved ? new Date() : null } : {}),
      };
      await tx.operationsNote.update({ where: { id }, data });
      await audit(
        {
          userId: user.id,
          action: change.resolved ? "note.resolved" : change.resolved === false ? "note.reopened" : "note.updated",
          targetType: "note",
          targetId: id,
          summary: `Operations note ${change.resolved ? "resolved" : change.resolved === false ? "reopened" : change.pinned ? "pinned" : "unpinned"}: ${prev.body.slice(0, 60)}`,
          previous: { pinned: prev.pinned, resolvedAt: prev.resolvedAt?.toISOString() ?? null },
          next: { pinned: data.pinned ?? prev.pinned, resolved: change.resolved ?? Boolean(prev.resolvedAt) },
        },
        tx,
      );
      return true;
    });
    if (!done) return { ok: false, error: "This note no longer exists." };
    revalidatePath("/admin/operations");
    return { ok: true };
  });
}
