"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthState = { error: string } | { info: string } | null;

/**
 * Creates the profiles + companies/student_details rows for a just-signed-up
 * user. Only callable with an active session for that user (RLS requires
 * auth.uid() = id) — see the two call sites below for why that isn't always
 * available right after auth.signUp().
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

    const { error: companyError } = await supabase
      .from("companies")
      .insert({ profile_id: user.id, company_name: fullName });
    if (companyError) return companyError;

    const { error: ownerError } = await supabase
      .from("company_members")
      .insert({ company_id: user.id, profile_id: user.id, role: "owner" });
    return ownerError;
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
  redirect("/opportunities");
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
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/opportunities");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
