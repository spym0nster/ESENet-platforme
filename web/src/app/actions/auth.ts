"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthState = { error: string } | { info: string } | null;

/**
 * This request's own origin (scheme + host), for building absolute
 * redirect URLs Supabase Auth emails back to. Server actions are POSTs, so
 * `origin` is normally set; fall back to the forwarded host behind Vercel's
 * proxy, then localhost for dev.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

/**
 * Creates the profiles row for a just-signed-up user, plus student_details
 * for a student. Only callable with an active session for that user (RLS
 * requires auth.uid() = id) — see the two call sites below for why that
 * isn't always available right after auth.signUp().
 *
 * A company-role signup deliberately does NOT auto-create a companies row
 * here anymore (it used to: the "full_name" field doubled as the new
 * company's name, and every company signup became that company's owner,
 * unconditionally). That made it impossible for a second person at a real
 * company to ever attach themselves to it instead of creating a duplicate
 * — there was no moment to choose. A company-role profile with no invite
 * and no company yet is left exactly that way; requireCompanyUser() routes
 * them to /company/onboarding, where they explicitly create a new company
 * or request to join an existing one (see actions/company-onboarding.ts).
 */
async function provisionProfile(
  supabase: SupabaseClient,
  user: User,
  fullName: string,
  role: UserRole
) {
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    role,
    full_name: fullName,
  });
  if (profileError) return profileError;

  if (role === "company") {
    // If this email has a pending invite from an existing company, join
    // that company as a team member instead of creating a new one.
    if (user.email) {
      const { data: invite } = await supabase
        .from("company_invites")
        .select("id, company_id")
        .eq("email", user.email)
        .is("accepted_at", null)
        .maybeSingle();

      if (invite) {
        const { error: memberError } = await supabase
          .from("company_members")
          .insert({ company_id: invite.company_id, profile_id: user.id, role: "member" });
        if (memberError) return memberError;

        const { error: acceptError } = await supabase
          .from("company_invites")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", invite.id);
        return acceptError;
      }
    }

    // No pending invite: leave them unattached. /company/onboarding (via
    // requireCompanyUser) is where they choose create-new vs
    // request-to-join — see the note above.
    return null;
  }
  if (role === "student") {
    const { error } = await supabase
      .from("student_details")
      .insert({ profile_id: user.id });
    return error;
  }
  // admin: profiles row alone is enough — no companies/student_details row.
  return null;
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  // Public signup can only ever create a student or company account — never
  // trust client input past that allowlist. "admin" is granted exclusively
  // by an existing admin (or a trusted operator), never via self-signup.
  const requestedRole = String(formData.get("role") ?? "student");
  const role: UserRole = requestedRole === "company" ? "company" : "student";

  if (!email || !password || !fullName) {
    return { error: "Please fill in every field." };
  }

  const supabase = await createClient();

  // full_name/role are also stashed in the auth user's metadata so they
  // survive to first login even when email confirmation is required below.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Something went wrong creating your account." };
  }

  // With email confirmation enabled, signUp() creates the auth user but
  // returns no session — there's no authenticated context yet to satisfy
  // the "auth.uid() = id" RLS check on profiles, so inserting now would
  // always fail. Defer profile creation to first sign-in instead (see
  // signIn below), once a real session exists.
  if (!data.session) {
    return {
      info: "Check your email to confirm your account, then log in.",
    };
  }

  const provisionError = await provisionProfile(supabase, data.user, fullName, role);
  if (provisionError) {
    return { error: provisionError.message };
  }

  revalidatePath("/", "layout");
  // Rare path (email confirmation is on, so signUp usually has no session).
  // A fresh student goes straight to onboarding.
  redirect(role === "student" ? "/onboarding" : "/opportunities");
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // First login after email confirmation: signUp() above couldn't create
  // the profile row (no session yet at that point), so do it now that one
  // exists, using the full_name/role stashed in the user's metadata.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fullName = String(data.user.user_metadata?.full_name ?? "");
    const role = (data.user.user_metadata?.role as UserRole) ?? "student";
    const provisionError = await provisionProfile(supabase, data.user, fullName, role);
    if (provisionError) {
      return { error: provisionError.message };
    }
  }

  revalidatePath("/", "layout");
  // Only ever redirect to a same-site relative path — never a value that
  // could send the user off ESENet.
  const dest =
    next.startsWith("/") && !next.startsWith("//") ? next : "/opportunities";

  // A student who hasn't finished onboarding goes there first, carrying
  // wherever they were headed as `?next=`.
  const [{ data: prof }, { data: sd }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle(),
    supabase
      .from("student_details")
      .select("onboarded_at")
      .eq("profile_id", data.user.id)
      .maybeSingle(),
  ]);
  if (prof?.role === "student" && !sd?.onboarded_at) {
    redirect(
      `/onboarding${dest !== "/opportunities" ? `?next=${encodeURIComponent(dest)}` : ""}`
    );
  }

  redirect(dest);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Sends the password-reset email. Always reports the same thing whether or
 * not the address has an account — never confirm which emails are
 * registered. The link lands on /auth/callback (exchanges the code for a
 * short-lived session), which forwards to /reset-password.
 */
export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await requestOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    console.error("requestPasswordReset failed:", error);
  }

  return {
    info: "If that email has an ESENet account, a password reset link is on its way. Check your inbox.",
  };
}

/**
 * Sets a new password. Only works with the recovery session established by
 * clicking the email link (via /auth/callback) — otherwise there's no user
 * and we bounce them back to request a fresh link.
 */
export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Use at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Your reset link has expired. Request a new one from the login page.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("updatePassword failed:", error);
    return { error: "We couldn't update your password. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/opportunities");
}
