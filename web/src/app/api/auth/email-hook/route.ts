import { Webhook } from "standardwebhooks";
import { renderAuthEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

// standardwebhooks uses Node's crypto; keep this off the edge runtime.
export const runtime = "nodejs";

/**
 * Supabase Auth "Send Email Hook" endpoint. Replaces Supabase's built-in
 * email sending for every auth email (signup confirmation, password
 * recovery, magic link, email change, reauthentication) — the built-in
 * sender is unreliable for external addresses on the free plan.
 *
 * Setup (Supabase dashboard → Authentication → Hooks → Send Email Hook):
 *   - Type: HTTPS
 *   - URL:  https://<your-domain>/api/auth/email-hook
 *   - Generate the secret there, then set it as SEND_EMAIL_HOOK_SECRET
 *     (format "v1,whsec_...") in this app's env (local + Vercel).
 *
 * The payload is Standard-Webhooks-signed; we verify it before sending.
 */
export async function POST(request: Request) {
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!rawSecret || !supabaseUrl) {
    console.error(
      "email-hook: SEND_EMAIL_HOOK_SECRET or NEXT_PUBLIC_SUPABASE_URL not set"
    );
    return Response.json(
      { error: { http_code: 500, message: "Email hook is not configured." } },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: {
    user: { email: string };
    email_data: {
      token: string;
      token_hash: string;
      redirect_to: string;
      email_action_type: string;
    };
  };

  try {
    // The library wants the bare base64 secret, not the "v1,whsec_" prefix.
    const wh = new Webhook(rawSecret.replace(/^v1,whsec_/, ""));
    event = wh.verify(payload, headers) as typeof event;
  } catch (err) {
    console.error("email-hook: signature verification failed:", err);
    return Response.json(
      { error: { http_code: 401, message: "Invalid signature." } },
      { status: 401 }
    );
  }

  const { user, email_data } = event;
  const verifyUrl =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${encodeURIComponent(email_data.token_hash)}` +
    `&type=${encodeURIComponent(email_data.email_action_type)}` +
    `&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

  const { subject, html, text } = renderAuthEmail({
    actionType: email_data.email_action_type,
    verifyUrl,
    token: email_data.token,
  });

  const { ok } = await sendEmail({ to: user.email, subject, html, text });
  if (!ok) {
    // Non-200 tells Supabase the email wasn't sent (it surfaces the error to
    // the caller / logs it) rather than silently dropping it.
    return Response.json(
      { error: { http_code: 502, message: "Email provider rejected the send." } },
      { status: 502 }
    );
  }

  return Response.json({});
}
