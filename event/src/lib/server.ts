import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";

// Registrations are written with the service role key, only from server
// actions: the tables have RLS on and no policies (see migration 0025).
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newCode(prefix: string) {
  let s = "";
  for (const b of randomBytes(8)) s += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${s}`;
}

export function qrSvg(code: string) {
  return QRCode.toString(code, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#07122e", light: "#ffffff" } });
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
}

// Best-effort transactional mail through Resend; never throws.
export async function sendMail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EVENT_EMAIL_FROM ?? "ESENet <onboarding@resend.dev>", to, subject, html }),
    });
  } catch (e) {
    console.error("event mail failed", e);
  }
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ENTITIES[c]);
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

// Mirror a registration to a Google Sheet through the Apps Script web app in
// docs/google-sheet.gs. Best-effort: Supabase stays the source of truth.
export async function mirrorToSheet(tab: "visitors" | "exhibitors", row: Record<string, string | number | boolean | null>) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ secret: process.env.GOOGLE_SHEET_SECRET ?? "", tab, row: { ...row, created_at: new Date().toISOString() } }),
      redirect: "follow",
    });
  } catch (e) {
    console.error("sheet mirror failed", e);
  }
}
