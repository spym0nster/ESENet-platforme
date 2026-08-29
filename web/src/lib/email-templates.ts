/**
 * Plain-HTML email templates (no CSS vars / <style> — email clients strip
 * them, so everything is inline). Light background for compatibility with a
 * navy header bar echoing the ESENet brand.
 */

const BRAND_NAVY = "#0B0E36";
const ACCENT = "#7B53FD";
const TEXT = "#17143C";
const MUTED = "#5b5875";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f4fc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fc;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background:${BRAND_NAVY};padding:20px 28px;">
<span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">ESENet</span>
</td></tr>
<tr><td style="padding:28px;color:${TEXT};font-size:15px;line-height:1.6;">
${bodyHtml}
</td></tr>
<tr><td style="padding:0 28px 28px;color:${MUTED};font-size:12px;line-height:1.5;">
ESENet — the ESEN Talent Network. You're receiving this because you have an ESENet account.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="border-radius:8px;background:${ACCENT};">
<a href="${href}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

export type EmailContent = { subject: string; html: string; text: string };

// ── Auth emails (Send Email Hook) ───────────────────────────────────────

type AuthEmailInput = {
  actionType: string; // signup | recovery | magiclink | email_change | reauthentication | invite
  verifyUrl: string;
  token: string; // the 6-digit OTP, as a copy/paste fallback
};

const AUTH_COPY: Record<
  string,
  { subject: string; heading: string; lead: string; cta: string }
> = {
  signup: {
    subject: "Confirm your ESENet account",
    heading: "Confirm your email",
    lead: "Thanks for signing up for ESENet. Confirm this address to activate your account.",
    cta: "Confirm email",
  },
  recovery: {
    subject: "Reset your ESENet password",
    heading: "Reset your password",
    lead: "We received a request to reset your ESENet password. This link is valid for a short time.",
    cta: "Reset password",
  },
  magiclink: {
    subject: "Your ESENet sign-in link",
    heading: "Sign in to ESENet",
    lead: "Use the link below to sign in. It's valid for a short time.",
    cta: "Sign in",
  },
  email_change: {
    subject: "Confirm your new ESENet email",
    heading: "Confirm your new email",
    lead: "Confirm this address to finish changing the email on your ESENet account.",
    cta: "Confirm new email",
  },
  reauthentication: {
    subject: "Your ESENet verification code",
    heading: "Verification code",
    lead: "Enter this code in ESENet to confirm it's you.",
    cta: "",
  },
  invite: {
    subject: "You've been invited to ESENet",
    heading: "You're invited to ESENet",
    lead: "You've been invited to join ESENet. Accept the invitation to set up your account.",
    cta: "Accept invitation",
  },
};

export function renderAuthEmail(input: AuthEmailInput): EmailContent {
  const copy = AUTH_COPY[input.actionType] ?? AUTH_COPY.magiclink;
  const isCodeOnly = input.actionType === "reauthentication";

  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:20px;color:${TEXT};">${escapeHtml(
      copy.heading
    )}</h1>
<p style="margin:0 0 4px;">${escapeHtml(copy.lead)}</p>
${isCodeOnly ? "" : button(input.verifyUrl, copy.cta)}
<p style="margin:12px 0 0;color:${MUTED};font-size:13px;">${
      isCodeOnly
        ? "Your code:"
        : "Or copy this one-time code if the button doesn't work:"
    } <strong style="color:${TEXT};letter-spacing:2px;">${escapeHtml(
      input.token
    )}</strong></p>
<p style="margin:16px 0 0;color:${MUTED};font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`
  );

  const text = [
    copy.heading,
    "",
    copy.lead,
    "",
    isCodeOnly ? `Code: ${input.token}` : input.verifyUrl,
    isCodeOnly ? "" : `One-time code: ${input.token}`,
    "",
    "If you didn't request this, you can ignore this email.",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return { subject: copy.subject, html, text };
}

// ── Notification emails ─────────────────────────────────────────────────

export function renderNotificationEmail(input: {
  title: string;
  body: string | null;
  url: string | null; // absolute
}): EmailContent {
  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:18px;color:${TEXT};">${escapeHtml(
      input.title
    )}</h1>
${input.body ? `<p style="margin:0 0 4px;">${escapeHtml(input.body)}</p>` : ""}
${input.url ? button(input.url, "View on ESENet") : ""}
<p style="margin:16px 0 0;color:${MUTED};font-size:13px;">Manage what reaches your inbox from your ESENet notifications page.</p>`
  );

  const text = [
    input.title,
    "",
    input.body ?? "",
    "",
    input.url ?? "",
  ]
    .join("\n")
    .trim();

  return { subject: input.title, html, text };
}
