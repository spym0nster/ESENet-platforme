import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
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

// Mail goes out through the Gmail / Google Workspace mailbox itself (SMTP with
// an app password), so no DNS setup is needed. Resend stays as a fallback
// when RESEND_API_KEY is set and no Gmail password is.
let transport: Transporter | null = null;
function gmail() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return null;
  transport ??= nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass }, pool: true, maxConnections: 3 });
  return transport;
}

export async function sendMail(to: string, subject: string, html: string): Promise<MailResult> {
  const smtp = gmail();
  if (smtp) {
    try {
      await smtp.sendMail({ from: FROM(), to, subject, html, replyTo: REPLY_TO });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send failed";
      console.error("event mail failed", msg);
      return { ok: false, error: msg };
    }
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "No mail account configured (GMAIL_USER / GMAIL_APP_PASSWORD)" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to, subject, html, reply_to: REPLY_TO }),
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: msg.message ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "network error" };
  }
}

// Personalised emails to many people: a few at a time, so a long list stays
// within Gmail's pace and the request time limit.
export async function sendBatch(emails: { to: string; subject: string; html: string }[]): Promise<{ sent: number; failed: number; error?: string }> {
  let sent = 0, failed = 0, error: string | undefined;
  for (let i = 0; i < emails.length; i += 5) {
    const results = await Promise.all(emails.slice(i, i + 5).map((m) => sendMail(m.to, m.subject, m.html)));
    for (const r of results) {
      if (r.ok) sent++;
      else {
        failed++;
        error = r.error;
      }
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
