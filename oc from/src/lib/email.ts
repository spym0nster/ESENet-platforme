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

export type DecisionKind = "accepted" | "rejected";

function layout(heading: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#00040F;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#FAFAFC">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;border:1px solid #13264A;background:#010819">
    <tr><td style="padding:28px 28px 8px;font-size:11px;letter-spacing:.18em;color:#2DA5E9;text-transform:uppercase">${EVENT.name} · Operations team</td></tr>
    <tr><td style="padding:0 28px;font-size:26px;font-weight:bold;letter-spacing:.02em">${heading}</td></tr>
    <tr><td style="padding:16px 28px 28px;font-size:15px;line-height:1.7;color:#C9CFDB">${bodyHtml}</td></tr>
  </table></body></html>`;
}

/** Decision emails sent manually by staff from the candidate page. */
export function decisionEmail(kind: DecisionKind, fullName: string) {
  const firstText = fullName.trim().split(/\s+/)[0] || fullName;
  const first = escapeHtml(firstText);

  if (kind === "accepted") {
    const subject = `${EVENT.name} — you are part of the OC team!`;
    const text = [
      `Hello ${firstText},`,
      "",
      `We are happy to tell you that your application has been accepted: you are part of the ${EVENT.name} Organizing Committee!`,
      "",
      "Please remember that your presence is required for the complete operational period: J-2, J-1 and Jour J.",
      `The ${EVENT.org} team will contact you soon with your mission, your team and the next steps.`,
      "",
      "Welcome aboard,",
      `— ${EVENT.org}`,
    ].join("\n");
    const html = layout(
      "Welcome to the team",
      `Hello ${first},<br/><br/>We are happy to tell you that your application has been <strong style="color:#55E274">accepted</strong>: you are part of the ${EVENT.name} Organizing Committee!<br/><br/>Please remember that your presence is required for the complete operational period: <strong>J-2, J-1 and Jour J</strong>. The ${EVENT.org} team will contact you soon with your mission, your team and the next steps.<br/><br/>Welcome aboard,<br/>— ${EVENT.org}`,
    );
    return { subject, text, html };
  }

  const subject = `${EVENT.name} — about your OC application`;
  const text = [
    `Hello ${firstText},`,
    "",
    `Thank you for applying to the ${EVENT.name} Organizing Committee and for the time you took to do so.`,
    "After reviewing all profiles, we are sorry to tell you that we are unable to offer you a place in the OC team this year.",
    "This was a difficult decision given the number of strong applications, and it says nothing about your potential.",
    "",
    `We would be glad to see you at ${EVENT.name} as a visitor, and to see you apply again for future ${EVENT.org} activities.`,
    "",
    "Kind regards,",
    `— ${EVENT.org}`,
  ].join("\n");
  const html = layout(
    "About your application",
    `Hello ${first},<br/><br/>Thank you for applying to the ${EVENT.name} Organizing Committee and for the time you took to do so.<br/><br/>After reviewing all profiles, we are sorry to tell you that we are unable to offer you a place in the OC team this year. This was a difficult decision given the number of strong applications, and it says nothing about your potential.<br/><br/>We would be glad to see you at ${EVENT.name} as a visitor, and to see you apply again for future ${EVENT.org} activities.<br/><br/>Kind regards,<br/>— ${EVENT.org}`,
  );
  return { subject, text, html };
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
