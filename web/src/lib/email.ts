import { Resend } from "resend";

/**
 * Transactional email via Resend. Best-effort: every send is wrapped so a
 * mail failure never throws into the caller (an auth flow or a server
 * action must not break because an email bounced) — it logs and returns
 * `{ ok: false }`.
 *
 * `EMAIL_FROM` defaults to Resend's shared `onboarding@resend.dev` sender,
 * which only delivers to the Resend account owner's address until a custom
 * domain is verified — fine for pre-launch. Set `EMAIL_FROM` once a domain
 * is verified (e.g. `ESENet <no-reply@esenet.tn>`).
 */

const FROM = process.env.EMAIL_FROM ?? "ESENet <onboarding@resend.dev>";

let client: Resend | null = null;
function resend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** True when an API key is configured — callers can skip work when it isn't. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(msg: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean }> {
  const r = resend();
  if (!r) {
    console.warn("sendEmail skipped: RESEND_API_KEY is not set");
    return { ok: false };
  }
  try {
    const { error } = await r.emails.send({
      from: FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    if (error) {
      console.error("sendEmail failed:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("sendEmail threw:", err);
    return { ok: false };
  }
}
