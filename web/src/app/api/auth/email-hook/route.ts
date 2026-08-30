import { Webhook } from "standardwebhooks";
import { renderAuthEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

// standardwebhooks uses Node's crypto; keep this off the edge runtime.
export const runtime = "nodejs";

type HookEvent = {
  user?: { email?: string };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
  };
};

/**
 * Supabase Auth "Send Email Hook" endpoint — renders and sends every auth
 * email (signup confirmation, recovery, magic link, email change, reauth)
 * via Resend, because the built-in sender is unreliable for external
 * addresses on the free plan.
 *
 * **FAIL OPEN.** GoTrue aborts the entire signup / recovery when a
 * configured hook returns non-200, so anything that makes this endpoint
 * error takes down account creation for everyone — which it did (missing
 * env var → 500 → 3-day signup outage; see SECURITY_PERFORMANCE_AUDIT.md
 * F5). The only thing that returns non-200 here is a *verifiably forged*
 * request. Every other failure — missing config, a Resend outage, a
 * malformed payload — is logged loudly and answered 200: the account is
 * created, and the email is recoverable via a resend.
 *
 * Needs, per environment:
 *   SEND_EMAIL_HOOK_SECRET  Standard-Webhooks secret, "v1,whsec_…"
 *                           (Supabase → Auth → Hooks → Send Email Hook)
 *   RESEND_API_KEY          resend.com → API Keys
 * Without them the account still gets created, but no email is sent.
 */
export async function POST(request: Request) {
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let payload = "";
  try {
    payload = await request.text();
  } catch {
    console.error("email-hook: couldn't read the request body");
    return Response.json({});
  }
  const headers = Object.fromEntries(request.headers);

  // --- signature: the only path that may reject the request ---
  let event: HookEvent | null = null;
  if (rawSecret) {
    try {
      const wh = new Webhook(rawSecret.replace(/^v1,whsec_/, ""));
      event = wh.verify(payload, headers) as HookEvent;
    } catch (err) {
      console.error("email-hook: signature verification failed", err);
      return Response.json(
        { error: { http_code: 401, message: "Invalid signature." } },
        { status: 401 }
      );
    }
  } else {
    // Misconfigured deployment. Returning 500 here is what caused the
    // outage — proceed unverified so signup keeps working, and log hard.
    console.error(
      "email-hook: SEND_EMAIL_HOOK_SECRET is not set — accepting UNVERIFIED so signup isn't blocked. Set it for this environment."
    );
    try {
      event = JSON.parse(payload) as HookEvent;
    } catch {
      console.error("email-hook: unverified payload is not JSON");
      return Response.json({});
    }
  }

  // --- send, best-effort. Nothing below ever returns non-200. ---
  try {
    const to = event?.user?.email;
    const d = event?.email_data ?? {};
    if (!to || !d.token_hash || !d.email_action_type) {
      console.error("email-hook: payload missing user.email / email_data");
      return Response.json({});
    }
    if (!supabaseUrl) {
      console.error(
        "email-hook: NEXT_PUBLIC_SUPABASE_URL not set — can't build the verify link, skipping the send"
      );
      return Response.json({});
    }

    const verifyUrl =
      `${supabaseUrl}/auth/v1/verify` +
      `?token=${encodeURIComponent(d.token_hash)}` +
      `&type=${encodeURIComponent(d.email_action_type)}` +
      `&redirect_to=${encodeURIComponent(d.redirect_to ?? "")}`;

    const { subject, html, text } = renderAuthEmail({
      actionType: d.email_action_type,
      verifyUrl,
      token: d.token ?? "",
    });

    const { ok } = await sendEmail({ to, subject, html, text });
    if (!ok) {
      console.error(
        `email-hook: send failed for "${d.email_action_type}" — account still created; the user can request a resend`
      );
    }
  } catch (err) {
    console.error("email-hook: unexpected error (swallowed to keep signup working)", err);
  }

  return Response.json({});
}
