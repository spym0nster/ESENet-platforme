import type { CandidateStatus, OperationalDay, Role } from "@/generated/prisma/enums";

export const EVENT = {
  name: "ESENet Talent Fair 2026",
  shortName: "ESENet 2026",
  theme: "Data Alchimie",
  tagline: "Turning Data into Value",
  org: "ESEN Ambassadors",
  orgUrl: "https://ambassadors.tn",
  domain: "esenet-oc.ambassadors.tn",
  /// Sent to a candidate only once they're accepted, in the welcome email.
  whatsappGroup: "https://chat.whatsapp.com/Bg962UijJow3yvwS4TDvl8",
} as const;

export const STATUS_ORDER: CandidateStatus[] = ["PENDING", "SHORTLISTED", "SELECTED", "WAITLIST", "REJECTED"];

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  PENDING: "Pending review",
  SHORTLISTED: "Shortlisted",
  SELECTED: "Selected",
  WAITLIST: "Waitlist",
  REJECTED: "Rejected",
};

export const DAY_ORDER: OperationalDay[] = ["J_MINUS_2", "J_MINUS_1", "JOUR_J"];

export const DAY_LABEL: Record<OperationalDay, string> = {
  J_MINUS_2: "J-2",
  J_MINUS_1: "J-1",
  JOUR_J: "JOUR J",
};

export const DAY_SLUG: Record<OperationalDay, string> = {
  J_MINUS_2: "j-2",
  J_MINUS_1: "j-1",
  JOUR_J: "jour-j",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  AMBASSADOR: "Ambassador",
};

export const PAGE_SIZE = 25;

/** CV upload limits (only active when BLOB_READ_WRITE_TOKEN is configured). */
export const CV_MAX_BYTES = 3 * 1024 * 1024;
export const CV_MIME_TYPES = ["application/pdf"] as const;

/** httpOnly cookie carrying the just-submitted application ID to /application/success (never in the URL). */
export const SUCCESS_COOKIE = "oc_application";
