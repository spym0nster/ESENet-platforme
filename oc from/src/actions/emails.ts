"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { db } from "@/lib/db";
import { decisionEmail, sendEmail } from "@/lib/email";
import { features } from "@/lib/env";

const schema = z.object({ candidateId: z.string().min(1).max(64), kind: z.enum(["accepted", "rejected"]) });

/**
 * Staff-triggered decision email. The candidate's status must already match
 * (accepted needs SELECTED, rejected needs REJECTED) so the wrong message can't reach the wrong person.
 * Every send is audit-logged with who sent it.
 */
export async function sendDecisionEmail(candidateId: string, kind: "accepted" | "rejected"): Promise<ActionResult> {
  return guarded("sendDecisionEmail", async () => {
    const user = await actor();
    const parsed = schema.safeParse({ candidateId, kind });
    if (!parsed.success) return invalid(parsed.error);

    if (!features.email) {
      return {
        ok: false,
        error: "Email is not configured yet. An admin needs to add the SMTP settings (EMAIL_SERVER and EMAIL_FROM) in Vercel.",
      };
    }

    const c = await db.candidate.findUnique({ where: { id: candidateId }, select: { fullName: true, email: true, status: true } });
    if (!c) return { ok: false, error: "This candidate no longer exists." };
    const required = kind === "accepted" ? "SELECTED" : "REJECTED";
    if (c.status !== required) {
      return {
        ok: false,
        error: kind === "accepted" ? "Select this candidate before sending the acceptance email." : "Reject this candidate before sending the rejection email.",
      };
    }

    const mail = decisionEmail(kind, c.fullName);
    const sent = await sendEmail(c.email, mail.subject, mail.text, mail.html);
    if (!sent) return { ok: false, error: "The email could not be sent. Check the SMTP settings and try again." };

    const label = kind === "accepted" ? "Acceptance" : "Rejection";
    await audit({
      userId: user.id,
      action: "candidate.email_sent",
      targetType: "candidate",
      targetId: candidateId,
      summary: `${label} email sent to ${c.fullName}`,
      next: { kind, to: c.email },
    });
    revalidatePath(`/admin/candidates/${candidateId}`);
    return { ok: true, message: `${label} email sent to ${c.fullName}` };
  });
}
