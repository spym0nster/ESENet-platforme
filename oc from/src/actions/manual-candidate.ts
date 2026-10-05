"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { CandidateStatus } from "@/generated/prisma/enums";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { generateApplicationId } from "@/lib/application-id";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { cleanMultiline, cleanText } from "@/lib/utils";
import { CLASS_YEARS } from "@/lib/validation/application";

const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`).optional().default("");

const manualSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the full name.").max(120),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address.")),
  phone: z.string().trim().regex(/^\+?[0-9][0-9 ().-]{6,18}[0-9]$/, "Enter a valid phone number."),
  classYear: z.enum(CLASS_YEARS, { error: "Choose the class / year." }),
  specialization: z.string().trim().min(2, "Enter the specialization.").max(120),
  linkedin: optionalText(200),
  portfolio: optionalText(200),
  skillIds: z.array(z.string().min(1).max(64)).min(1, "Select at least one skill.").max(20),
  eventExperience: z.boolean(),
  eventExperienceDetails: optionalText(1200),
  ambassadorExperience: z.boolean(),
  ambassadorExperienceDetails: optionalText(1200),
  whatCanYouBring: optionalText(1500),
  internalNotes: optionalText(2000),
  status: z.enum(CandidateStatus),
  /** The staff member attests the person agreed to all three operational days. */
  availabilityConfirmed: z.boolean().refine((v) => v === true, "Confirm the candidate is available for J-2, J-1 and Jour J."),
});

export type ManualCandidateInput = z.input<typeof manualSchema>;

/** Staff adds an application by hand (e.g. someone who applied on paper or by message). */
export async function createCandidateManually(input: ManualCandidateInput): Promise<ActionResult<{ id: string }>> {
  return guarded<{ id: string }>("createCandidateManually", async () => {
    const user = await actor();
    const parsed = manualSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;

    const skills = await db.skill.findMany({ where: { id: { in: d.skillIds } } });
    if (skills.length !== new Set(d.skillIds).size) return { ok: false, error: "One of the skills no longer exists. Refresh and try again." };

    const now = new Date();
    for (let attempt = 0; attempt < 4; attempt++) {
      const applicationId = generateApplicationId();
      try {
        const created = await db.$transaction(async (tx) => {
          const c = await tx.candidate.create({
            data: {
              applicationId,
              fullName: cleanText(d.fullName),
              email: d.email,
              phone: cleanText(d.phone),
              classYear: d.classYear,
              specialization: cleanText(d.specialization),
              linkedin: d.linkedin || null,
              portfolio: d.portfolio || null,
              availabilityConfirmed: true,
              consentAt: now,
              eventExperience: d.eventExperience,
              eventExperienceDetails: d.eventExperience && d.eventExperienceDetails ? cleanMultiline(d.eventExperienceDetails) : null,
              ambassadorExperience: d.ambassadorExperience,
              ambassadorExperienceDetails:
                d.ambassadorExperience && d.ambassadorExperienceDetails ? cleanMultiline(d.ambassadorExperienceDetails) : null,
              whatCanYouBring: d.whatCanYouBring ? cleanMultiline(d.whatCanYouBring) : `Added manually by ${user.name}.`,
              internalNotes: d.internalNotes ? cleanMultiline(d.internalNotes) : null,
              status: d.status,
              reviewedAt: d.status === "PENDING" ? null : now,
              reviewedById: d.status === "PENDING" ? null : user.id,
              skills: { create: skills.map((s) => ({ skillId: s.id })) },
            },
          });
          await audit(
            {
              userId: user.id,
              action: "candidate.created_manually",
              targetType: "candidate",
              targetId: c.id,
              summary: `${c.fullName} added manually by ${user.name} (${STATUS_LABEL[d.status]})`,
              next: { status: d.status, applicationId },
            },
            tx,
          );
          return c;
        });
        revalidatePath("/admin", "layout");
        return { ok: true, data: { id: created.id }, message: `${created.fullName} added` };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          if (await db.candidate.findUnique({ where: { email: d.email }, select: { id: true } })) {
            return { ok: false, error: "A candidate with this email already exists.", fieldErrors: { email: "Already registered." } };
          }
          continue; // application ID collision, retry
        }
        throw err;
      }
    }
    return { ok: false, error: "Could not generate a unique application ID. Please try again." };
  });
}
