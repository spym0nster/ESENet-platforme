"use server";

import { del } from "@vercel/blob";
import { cookies } from "next/headers";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { generateApplicationId } from "@/lib/application-id";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { applicationReceivedEmail, sendEmail } from "@/lib/email";
import { features } from "@/lib/env";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { clientIp, hashKey } from "@/lib/request";
import { getSettingsSafe } from "@/lib/services/settings";
import { storeCv, validateCv } from "@/lib/storage";
import { SUCCESS_COOKIE } from "@/lib/constants";
import { cleanMultiline, cleanText } from "@/lib/utils";
import { applicationSchema } from "@/lib/validation/application";

export type SubmitApplicationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };


const GENERIC_ERROR = "Something went wrong while saving your application. Please try again in a moment.";
const DUPLICATE_ERROR = "An application already exists for this email address.";

export async function submitApplication(formData: FormData): Promise<SubmitApplicationResult> {
  try {
    const settings = await getSettingsSafe();
    if (!settings.applicationsOpen) {
      return { ok: false, error: "Applications are currently closed." };
    }

    // Shared campus Wi-Fi means many students share one IP — keep the per-IP limit generous.
    const ip = await clientIp();
    if (!(await rateLimit(`apply:ip:${hashKey(ip)}`, 30, 10 * 60))) {
      return { ok: false, error: "Too many attempts from this network. Please wait a few minutes and try again." };
    }

    const raw = formData.get("payload");
    if (typeof raw !== "string" || raw.length > 40_000) return { ok: false, error: GENERIC_ERROR };
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return { ok: false, error: GENERIC_ERROR };
    }

    const parsed = applicationSchema.safeParse(json);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false, error: "Some answers need your attention.", fieldErrors };
    }
    const data = parsed.data;

    // Honeypot filled → a bot. Pretend success, store nothing.
    if (data.website) return { ok: true };

    if (!(await rateLimit(`apply:email:${hashKey(data.email)}`, 6, 60 * 60))) {
      return { ok: false, error: "Too many attempts for this email address. Please try again later." };
    }

    // Skills must be real, active skill rows.
    const skills = await db.skill.findMany({ where: { id: { in: data.skillIds }, active: true } });
    if (skills.length !== data.skillIds.length) {
      return { ok: false, error: "Some answers need your attention.", fieldErrors: { skillIds: "Please re-select your skills." } };
    }
    const otherTicked = skills.some((s) => s.isOther);
    if (otherTicked && data.otherSkill.length < 2) {
      return { ok: false, error: "Some answers need your attention.", fieldErrors: { otherSkill: "Tell us which other skill." } };
    }

    if (await db.candidate.findUnique({ where: { email: data.email }, select: { id: true } })) {
      return { ok: false, error: DUPLICATE_ERROR, fieldErrors: { email: DUPLICATE_ERROR } };
    }

    // Optional CV
    const cv = formData.get("cv");
    const hasCv = cv instanceof File && cv.size > 0;
    if (hasCv && !features.cvUpload) {
      return { ok: false, error: "CV upload is not available right now. Remove the file and submit again." };
    }
    if (hasCv) {
      const check = await validateCv(cv);
      if (!check.ok) return { ok: false, error: check.error, fieldErrors: { cv: check.error } };
    }

    let applicationId = "";
    let uploaded: { pathname: string; fileName: string } | null = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      applicationId = generateApplicationId();
      try {
        if (hasCv && !uploaded) uploaded = await storeCv(cv, applicationId);
        await db.$transaction(async (tx) => {
          const candidate = await tx.candidate.create({
            data: {
              applicationId,
              fullName: cleanText(data.fullName),
              email: data.email,
              phone: cleanText(data.phone),
              classYear: data.classYear,
              specialization: cleanText(data.specialization),
              linkedin: data.linkedin || null,
              portfolio: data.portfolio || null,
              availabilityConfirmed: true,
              consentAt: new Date(),
              eventExperience: data.eventExperience === "yes",
              eventExperienceDetails: data.eventExperience === "yes" ? cleanMultiline(data.eventExperienceDetails) : null,
              ambassadorExperience: data.ambassadorExperience === "yes",
              ambassadorExperienceDetails:
                data.ambassadorExperience === "yes" ? cleanMultiline(data.ambassadorExperienceDetails) : null,
              whatCanYouBring: cleanMultiline(data.whatCanYouBring),
              additionalInformation: data.additionalInformation ? cleanMultiline(data.additionalInformation) : null,
              otherSkill: otherTicked ? cleanText(data.otherSkill) : null,
              cvUrl: uploaded?.pathname ?? null,
              cvFileName: uploaded?.fileName ?? null,
              skills: { create: skills.map((s) => ({ skillId: s.id })) },
            },
          });
          await audit(
            {
              userId: null,
              action: "candidate.applied",
              targetType: "candidate",
              targetId: candidate.id,
              summary: `Application ${applicationId} received`,
              next: { status: "PENDING" },
            },
            tx,
          );
        });
        break;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Either the email raced another submission, or (astronomically rarely) the ID collided.
          if (await db.candidate.findUnique({ where: { email: data.email }, select: { id: true } })) {
            if (uploaded) await del(uploaded.pathname).catch(() => {});
            return { ok: false, error: DUPLICATE_ERROR, fieldErrors: { email: DUPLICATE_ERROR } };
          }
          continue; // applicationId collision → new ID
        }
        if (uploaded) await del(uploaded.pathname).catch(() => {});
        throw err;
      }
    }

    const jar = await cookies();
    jar.set(SUCCESS_COOKIE, applicationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/application",
      maxAge: 60 * 60,
    });

    after(async () => {
      const mail = applicationReceivedEmail(cleanText(data.fullName), applicationId);
      await sendEmail(data.email, mail.subject, mail.text, mail.html);
      if (Math.random() < 0.05) await pruneRateLimits();
    });

    return { ok: true };
  } catch (err) {
    console.error("[submitApplication]", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
