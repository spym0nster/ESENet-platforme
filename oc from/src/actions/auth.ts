"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

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
