"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { appUrl, features } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashKey } from "@/lib/request";
import { normalizeEmail } from "@/lib/utils";

export type LoginState = { error?: string } | undefined;

/** Only allow redirects back into the staff area — never to an external URL. */
function safeNext(raw: FormDataEntryValue | null) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/admin") && !v.startsWith("//") && !v.includes("\\") ? v : "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Enter your email and password." };
  }
  try {
    await signIn("credentials", { email, password, redirectTo: safeNext(formData.get("next")) });
  } catch (err) {
    if (err instanceof AuthError) {
      if ((err as AuthError & { code?: string }).code === "rate_limited") {
        return { error: "Too many sign-in attempts. Wait 15 minutes and try again." };
      }
      return { error: "Incorrect email or password, or the account is disabled." };
    }
    throw err; // NEXT_REDIRECT on success
  }
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}

/* ── Forgot password ───────────────────────────────────────────
 * Self-service recovery for a locked-out staff member. The response is deliberately the same
 * whether or not the email matches an account, and whether or not it's rate-limited — so the
 * form can never be used to discover which addresses are registered.
 */

const GENERIC_RESET_MESSAGE = "If that email has an account, we've sent a password reset link. It expires in 1 hour.";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export type ForgotPasswordState = { message?: string; error?: string } | undefined;

export async function requestPasswordReset(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const raw = formData.get("email");
  if (typeof raw !== "string" || !raw.trim()) return { error: "Enter your email address." };
  const email = normalizeEmail(raw);

  const ip = await clientIp();
  if (!(await rateLimit(`pwreset:ip:${hashKey(ip)}`, 10, 15 * 60))) {
    return { error: "Too many attempts from this network. Please wait a few minutes and try again." };
  }
  // A per-account limit that's exceeded still returns the generic message below — never a
  // different one — so the reply itself can't be used to tell accounts from non-accounts.
  const underAccountLimit = await rateLimit(`pwreset:acct:${hashKey(email)}`, 4, 60 * 60);

  if (underAccountLimit) {
    // Never let a DB hiccup turn into a different (or broken) response — same reply either way.
    try {
      const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, active: true } });
      if (user?.active) {
        const token = randomBytes(32).toString("base64url");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await db.$transaction(async (tx) => {
          // Only one live link at a time — issuing a new one retires any previous, unused one.
          await tx.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
          await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } });
        });
        const link = `${appUrl()}/admin/reset-password?token=${token}`;
        if (features.email) {
          const mail = passwordResetEmail(user.name, link);
          await sendEmail(user.email, mail.subject, mail.text, mail.html);
        } else {
          console.info(`[auth] EMAIL_SERVER not configured — password reset link for ${user.email}: ${link}`);
        }
      }
    } catch (err) {
      console.error("[requestPasswordReset]", err);
    }
  }

  return { message: GENERIC_RESET_MESSAGE };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1).max(200),
    password: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." });

export type ResetPasswordState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function resetPassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }

  const ip = await clientIp();
  if (!(await rateLimit(`pwreset:confirm:${hashKey(ip)}`, 20, 15 * 60))) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const tokenHash = hashToken(parsed.data.token);
  try {
    const row = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return { error: "This reset link is invalid or has expired. Request a new one." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
      // Retire every outstanding link for this user, not just the one just used.
      await tx.passwordResetToken.deleteMany({ where: { userId: row.userId, usedAt: null } });
      await audit(
        { userId: row.userId, action: "user.password_reset_self", targetType: "user", targetId: row.userId, summary: "Password reset via emailed link" },
        tx,
      );
    });
  } catch (err) {
    console.error("[resetPassword]", err);
    return { error: "Something went wrong. Nothing was changed — please try again." };
  }

  redirect("/admin/login?reset=1");
}
