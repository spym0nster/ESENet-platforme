import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Trim + lowercase. The single source of truth for email normalization. */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Collapse inner whitespace and trim. */
export function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Trim multi-line text, keep paragraph breaks, strip control characters. */
export function cleanMultiline(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Tunis",
});

export function formatDate(d: Date | string) {
  return dateFmt.format(typeof d === "string" ? new Date(d) : d);
}

export function formatDateTime(d: Date | string) {
  return dateTimeFmt.format(typeof d === "string" ? new Date(d) : d);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

/** "Master 1 (M1)" → "M1"; anything without a code in parentheses is returned as-is. */
export function shortClass(classYear: string) {
  return /\(([A-Z0-9]{1,4})\)\s*$/.exec(classYear)?.[1] ?? classYear;
}
