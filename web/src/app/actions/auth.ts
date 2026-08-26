"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthState = { error: string } | null;

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const role = String(formData.get("role") ?? "student") as UserRole;

  if (!email || !password || !fullName) {
    return { error: "Please fill in every field." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      role,
      full_name: fullName,
    });

    if (profileError) {
      return { error: profileError.message };
    }

    if (role === "company") {
      const { error: companyError } = await supabase.from("companies").insert({
        profile_id: data.user.id,
        company_name: fullName,
      });
      if (companyError) {
        return { error: companyError.message };
      }
    } else {
      const { error: studentError } = await supabase
        .from("student_details")
        .insert({ profile_id: data.user.id });
      if (studentError) {
        return { error: studentError.message };
      }
    }
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/opportunities");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
