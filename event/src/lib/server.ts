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

const FROM = () => process.env.EVENT_EMAIL_FROM ?? "ESENet Talent Fair <esenet.talentfair@esen.tn>";
const REPLY_TO = "esenet.talentfair@esen.tn";

export type MailResult = { ok: boolean; error?: string };

// Transactional mail through Resend. Never throws: callers decide what a
// failed send means (registration ignores it, the admin tool reports it).
export async function sendMail(to: string, subject: string, html: string): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to, subject, html, reply_to: REPLY_TO }),
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => ({}))) as { message?: string };
      console.error("event mail failed", res.status, msg.message);
      return { ok: false, error: msg.message ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("event mail failed", e);
    return { ok: false, error: "network error" };
  }
}

// Up to 100 personalised emails per call (Resend batch API).
export async function sendBatch(emails: { to: string; subject: string; html: string }[]): Promise<{ sent: number; failed: number; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: 0, failed: emails.length, error: "RESEND_API_KEY is not set" };
  let sent = 0, failed = 0, error: string | undefined;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map((m) => ({ from: FROM(), to: m.to, subject: m.subject, html: m.html, reply_to: REPLY_TO }))),
      });
      if (res.ok) sent += chunk.length;
      else {
        failed += chunk.length;
        error = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? `HTTP ${res.status}`;
      }
    } catch {
      failed += chunk.length;
      error = "network error";
    }
  }
  return { sent, failed, error };
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
