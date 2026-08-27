"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileItemState = { error: string } | { success: true } | null;

/**
 * Config for the four 1:many student-profile tables. All share the same
 * ownership shape (profile_id references student_details, owner-only
 * write) so one generic add/delete action pair covers all of them instead
 * of four near-duplicate files.
 */
const TABLES = {
  education: { requiredField: "school" },
  experiences: { requiredField: "title" },
  projects: { requiredField: "title" },
  certifications: { requiredField: "name" },
} as const;

type TableName = keyof typeof TABLES;

function isValidTable(value: string): value is TableName {
  return Object.prototype.hasOwnProperty.call(TABLES, value);
}

async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "You must be signed in." } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    return { supabase, user: null, error: "Only student accounts can do this." } as const;
  }

  return { supabase, user, error: null } as const;
}

export async function addProfileItem(
  _prevState: ProfileItemState,
  formData: FormData
): Promise<ProfileItemState> {
  const table = String(formData.get("table") ?? "");
  if (!isValidTable(table)) {
    return { error: "Invalid section." };
  }

  const { supabase, user, error: authError } = await requireStudent();
  if (!user) return { error: authError };

  // Every column the form might send, for any of the 4 tables. Only the
  // ones that exist as real columns on the target table are written —
  // Postgres will reject the rest, but we filter to the known set anyway
  // so a request can't graft an arbitrary column name onto the insert.
  const allowedColumns = [
    "school",
    "degree",
    "field_of_study",
    "title",
    "organization",
    "description",
    "url",
    "name",
    "issuer",
    "issue_date",
    "start_date",
    "end_date",
  ];

  const row: Record<string, string | null> = { profile_id: user.id };
  for (const col of allowedColumns) {
    const value = formData.get(col);
    if (value !== null) {
      const trimmed = String(value).trim();
      row[col] = trimmed || null;
    }
  }

  const requiredField = TABLES[table].requiredField;
  if (!row[requiredField]) {
    return { error: `Please fill in the required field.` };
  }

  const { error } = await supabase.from(table).insert(row);

  if (error) {
    console.error(`addProfileItem(${table}) failed:`, error);
    return { error: "We couldn't save that. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteProfileItem(
  _prevState: ProfileItemState,
  formData: FormData
): Promise<ProfileItemState> {
  const table = String(formData.get("table") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!isValidTable(table) || !id) {
    return { error: "Invalid request." };
  }

  const { supabase, user, error: authError } = await requireStudent();
  if (!user) return { error: authError };

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    console.error(`deleteProfileItem(${table}) failed:`, error);
    return { error: "We couldn't remove that. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true };
}
