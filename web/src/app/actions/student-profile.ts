"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { patchStudentDetails } from "@/lib/students";

export type ProfileActionState = { error: string } | { success: true } | null;

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_CV_TYPES = ["application/pdf"];

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

export async function updateStudentProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const { supabase, user, error: authError } = await requireStudent();
  if (!user) return { error: authError };

  // Partial update: only the fields this request actually carried get
  // written, so a caller with a subset (an onboarding step) can't blank the
  // rest. The /profile form still submits every field, so its behaviour is
  // unchanged.
  const patch: Record<string, unknown> = {};
  const text = (key: string) => {
    if (!formData.has(key)) return;
    const v = String(formData.get(key) ?? "").trim();
    patch[key] = v || null;
  };
  text("headline");
  text("bio");
  text("looking_for");
  text("availability");
  text("linkedin_url");

  if (formData.has("skills")) {
    try {
      const parsed = JSON.parse(String(formData.get("skills") ?? "[]"));
      if (Array.isArray(parsed)) {
        patch.skills = parsed
          .map((s) => String(s).trim())
          .filter(Boolean)
          .slice(0, 20);
      }
    } catch {
      // ignore malformed payload
    }
  }

  const { error } = await patchStudentDetails(supabase, user.id, patch);

  if (error) {
    console.error("updateStudentProfile failed:", error);
    return { error: "We couldn't save your profile. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function uploadCv(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const { supabase, user, error: authError } = await requireStudent();
  if (!user) return { error: authError };

  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF file first." };
  }
  if (!ALLOWED_CV_TYPES.includes(file.type)) {
    return { error: "CVs must be a PDF file." };
  }
  if (file.size > MAX_CV_BYTES) {
    return { error: "CV must be under 5MB." };
  }

  const path = `${user.id}/cv.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, file, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("uploadCv failed:", uploadError);
    return { error: "We couldn't upload your CV. Please try again." };
  }

  const { error: dbError } = await supabase
    .from("student_details")
    .update({ cv_url: path })
    .eq("profile_id", user.id);

  if (dbError) {
    console.error("uploadCv db update failed:", dbError);
    return { error: "Your file uploaded, but we couldn't save it to your profile." };
  }

  revalidatePath("/profile");
  return { success: true };
}
