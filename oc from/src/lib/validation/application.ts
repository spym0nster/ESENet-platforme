import { z } from "zod";

/**
 * The OC application schema. Shared by the client form (React Hook Form resolver, per-step
 * validation) and the server action (authoritative re-validation). Never trust the client copy.
 */

export const CLASS_YEARS = [
  "1st year — Licence (L1)",
  "2nd year — Licence (L2)",
  "3rd year — Licence (L3)",
  "Master 1 (M1)",
  "Master 2 (M2)",
  "Other",
] as const;

const phoneRegex = /^\+?[0-9][0-9 ().-]{6,18}[0-9]$/;

const optionalUrlOrHandle = z
  .string()
  .trim()
  .max(200, "Keep this under 200 characters.")
  .refine(
    (v) => v === "" || /^@[\w.]{1,60}$/.test(v) || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v),
    "Enter a full link (https://…) or an @handle.",
  );

const optionalLinkedin = z
  .string()
  .trim()
  .max(200, "Keep this under 200 characters.")
  .refine(
    (v) => v === "" || /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/[^\s]+$/i.test(v),
    "Enter your LinkedIn profile link (https://linkedin.com/in/…).",
  );

const yesNo = z.enum(["yes", "no"], { error: "Choose yes or no." });

export const applicationSchema = z
  .object({
    // 01 — Profile
    fullName: z
      .string()
      .trim()
      .min(3, "Enter your full name.")
      .max(120, "Keep this under 120 characters.")
      .refine((v) => /\p{L}/u.test(v), "Enter your full name."),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address.")),
    phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number (e.g. +216 20 123 456)."),
    classYear: z.enum(CLASS_YEARS, { error: "Choose your class / academic year." }),
    specialization: z
      .string()
      .trim()
      .min(2, "Enter your specialization / major.")
      .max(120, "Keep this under 120 characters."),
    linkedin: optionalLinkedin,
    portfolio: optionalUrlOrHandle,

    // 02 — Skills
    skillIds: z
      .array(z.string().min(1).max(64))
      .min(1, "Select at least one skill.")
      .max(20, "Select up to 20 skills."),
    otherSkill: z.string().trim().max(120, "Keep this under 120 characters."),

    // 03 — Experience & profile
    eventExperience: yesNo,
    eventExperienceDetails: z.string().trim().max(1200, "Keep this under 1200 characters."),
    ambassadorExperience: yesNo,
    ambassadorExperienceDetails: z.string().trim().max(1200, "Keep this under 1200 characters."),
    whatCanYouBring: z
      .string()
      .trim()
      .min(20, "Tell us a little more (at least 20 characters).")
      .max(1500, "Keep this under 1500 characters."),
    additionalInformation: z.string().trim().max(1500, "Keep this under 1500 characters."),

    // 04 — Commitment
    availabilityConfirmed: z.boolean().refine((v) => v === true, {
      message: "You must be available for J-2, J-1 and Jour J to join the OC team.",
    }),
    consent: z.boolean().refine((v) => v === true, {
      message: "Please confirm so we can process your application.",
    }),

    // Honeypot — real people never see or fill this.
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.eventExperience === "yes" && v.eventExperienceDetails.length < 5) {
      ctx.addIssue({ code: "custom", path: ["eventExperienceDetails"], message: "Tell us briefly about it." });
    }
    if (v.ambassadorExperience === "yes" && v.ambassadorExperienceDetails.length < 5) {
      ctx.addIssue({ code: "custom", path: ["ambassadorExperienceDetails"], message: "Tell us briefly about it." });
    }
    if (new Set(v.skillIds).size !== v.skillIds.length) {
      ctx.addIssue({ code: "custom", path: ["skillIds"], message: "Duplicate skill selected." });
    }
  });

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationData = z.output<typeof applicationSchema>;

/** Which fields each form step owns — used for per-step validation on the client. */
export const STEP_FIELDS = {
  profile: ["fullName", "email", "phone", "classYear", "specialization", "linkedin", "portfolio"],
  skills: ["skillIds", "otherSkill"],
  experience: [
    "eventExperience",
    "eventExperienceDetails",
    "ambassadorExperience",
    "ambassadorExperienceDetails",
    "whatCanYouBring",
    "additionalInformation",
  ],
  commitment: ["availabilityConfirmed", "consent"],
} as const satisfies Record<string, readonly (keyof ApplicationInput)[]>;

export const EMPTY_APPLICATION: ApplicationInput = {
  fullName: "",
  email: "",
  phone: "",
  classYear: undefined as unknown as ApplicationInput["classYear"],
  specialization: "",
  linkedin: "",
  portfolio: "",
  skillIds: [],
  otherSkill: "",
  eventExperience: undefined as unknown as ApplicationInput["eventExperience"],
  eventExperienceDetails: "",
  ambassadorExperience: undefined as unknown as ApplicationInput["ambassadorExperience"],
  ambassadorExperienceDetails: "",
  whatCanYouBring: "",
  additionalInformation: "",
  availabilityConfirmed: false,
  consent: false,
  website: "",
};
