"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CandidateStatus } from "@/generated/prisma/enums";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { cleanMultiline } from "@/lib/utils";

const idSchema = z.string().min(1).max(64);

/**
 * Change an application's status. Candidates are never deleted from the UI — rejecting is a status.
 * Moving a SELECTED person to any other status ends their active assignments (with audit trail),
 * so nobody can be "assigned" without being selected.
 */
export async function setCandidateStatus(candidateId: string, status: CandidateStatus): Promise<ActionResult> {
  return guarded("setCandidateStatus", async () => {
    const user = await actor();
    const parsed = z.object({ candidateId: idSchema, status: z.enum(CandidateStatus) }).safeParse({ candidateId, status });
    if (!parsed.success) return invalid(parsed.error);

    let ended = 0;
    const changed = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Candidate" WHERE id = ${candidateId} FOR UPDATE`;
      const c = await tx.candidate.findUnique({ where: { id: candidateId }, select: { status: true, fullName: true } });
      if (!c) return null;
      if (c.status === status) return false;

      await tx.candidate.update({
        where: { id: candidateId },
        data: { status, reviewedAt: new Date(), reviewedById: user.id },
      });

      if (c.status === "SELECTED") {
        const active = await tx.assignment.findMany({ where: { candidateId, active: true }, select: { id: true } });
        ended = active.length;
        if (ended) {
          await tx.assignment.updateMany({
            where: { candidateId, active: true },
            data: { active: false, endedAt: new Date(), endedById: user.id, endReason: `Status changed to ${STATUS_LABEL[status]}` },
          });
        }
      }

      await audit(
        {
          userId: user.id,
          action: "candidate.status_changed",
          targetType: "candidate",
          targetId: candidateId,
          summary: `${c.fullName}: ${STATUS_LABEL[c.status]} → ${STATUS_LABEL[status]}${ended ? ` (${ended} assignment${ended > 1 ? "s" : ""} ended)` : ""}`,
          previous: { status: c.status },
          next: { status },
        },
        tx,
      );
      return true;
    });

    if (changed === null) return { ok: false, error: "This application no longer exists." };
    revalidatePath("/admin", "layout");
    return { ok: true, message: changed ? `Marked as ${STATUS_LABEL[status].toLowerCase()}` : undefined };
  });
}

export async function setCandidateNotes(candidateId: string, notes: string): Promise<ActionResult> {
  return guarded("setCandidateNotes", async () => {
    const user = await actor();
    const parsed = z.object({ id: idSchema, notes: z.string().max(4000, "Keep notes under 4000 characters.") }).safeParse({ id: candidateId, notes });
    if (!parsed.success) return invalid(parsed.error);
    const clean = cleanMultiline(parsed.data.notes) || null;

    await db.$transaction(async (tx) => {
      const prev = await tx.candidate.findUniqueOrThrow({ where: { id: candidateId }, select: { internalNotes: true, fullName: true } });
      await tx.candidate.update({ where: { id: candidateId }, data: { internalNotes: clean } });
      await audit(
        { userId: user.id, action: "candidate.notes_updated", targetType: "candidate", targetId: candidateId, summary: `Internal notes updated for ${prev.fullName}`, previous: { internalNotes: prev.internalNotes }, next: { internalNotes: clean } },
        tx,
      );
    });
    revalidatePath(`/admin/candidates/${candidateId}`);
    return { ok: true, message: "Notes saved" };
  });
}

/** Flag (or un-flag) a person for the Operations "People to contact" list. */
export async function setContactReason(candidateId: string, reason: string | null): Promise<ActionResult> {
  return guarded("setContactReason", async () => {
    const user = await actor();
    const parsed = z.object({ id: idSchema, reason: z.string().trim().max(300).nullable() }).safeParse({ id: candidateId, reason });
    if (!parsed.success) return invalid(parsed.error);
    const value = parsed.data.reason || null;

    await db.$transaction(async (tx) => {
      const prev = await tx.candidate.findUniqueOrThrow({ where: { id: candidateId }, select: { contactReason: true, fullName: true } });
      await tx.candidate.update({ where: { id: candidateId }, data: { contactReason: value } });
      await audit(
        {
          userId: user.id,
          action: value ? "candidate.contact_flagged" : "candidate.contact_cleared",
          targetType: "candidate",
          targetId: candidateId,
          summary: value ? `${prev.fullName} flagged to contact: ${value}` : `${prev.fullName} removed from contact list`,
          previous: { contactReason: prev.contactReason },
          next: { contactReason: value },
        },
        tx,
      );
    });
    revalidatePath("/admin", "layout");
    return { ok: true, message: value ? "Added to people to contact" : "Removed from people to contact" };
  });
}
