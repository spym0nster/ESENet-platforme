import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { EVENT } from "@/lib/constants";
import { features } from "@/lib/env";

/**
 * Optional transactional email (SMTP via EMAIL_SERVER + EMAIL_FROM).
 * When not configured, every send is a logged no-op — the app works the same without it.
 * Never throws: an email failure must never fail the action that triggered it.
 */
let transporter: Transporter | null = null;

function getTransporter() {
  if (!features.email) return null;
  transporter ??= nodemailer.createTransport(process.env.EMAIL_SERVER!);
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html: string) {
  const t = getTransporter();
  if (!t) {
    console.info(`[email] not configured — skipped "${subject}"`);
    return false;
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}

export function applicationReceivedEmail(name: string, applicationId: string) {
  const subject = `${EVENT.name} — OC application received (${applicationId})`;
  const text = [
    `Hello ${name},`,
    "",
    `Your application to the ${EVENT.name} operational team has been received.`,
    `Application ID: ${applicationId}`,
    "",
    `Your profile will be reviewed by the ${EVENT.org} team.`,
    "",
    `— ${EVENT.org}`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#00040F;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#FAFAFC">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;border:1px solid #13264A;background:#010819">
    <tr><td style="padding:28px 28px 8px;font-size:11px;letter-spacing:.18em;color:#2DA5E9;text-transform:uppercase">${EVENT.name} · Operations team</td></tr>
    <tr><td style="padding:0 28px;font-size:26px;font-weight:bold;letter-spacing:.02em">Application received</td></tr>
    <tr><td style="padding:16px 28px;font-size:15px;line-height:1.6;color:#C9CFDB">Hello ${escapeHtml(name)},<br/>Your application to the ${EVENT.name} operational team has been received.</td></tr>
    <tr><td style="padding:0 28px"><div style="border:1px solid #13264A;padding:14px 16px;font-family:'Courier New',monospace;font-size:13px;color:#9CA29D">APPLICATION ID<br/><span style="font-size:20px;color:#55E274;letter-spacing:.08em">${escapeHtml(applicationId)}</span></div></td></tr>
    <tr><td style="padding:16px 28px 28px;font-size:14px;line-height:1.6;color:#C9CFDB">Your profile will be reviewed by the ${EVENT.org} team.</td></tr>
  </table></body></html>`;
  return { subject, text, html };
}
