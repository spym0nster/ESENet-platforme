"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";

export type ProfileMediaState = { error: string } | { success: true } | null;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Uploads a student's or company's avatar/banner to the shared public
 * `profile-media` bucket and points the owning row's *_url column at it.
 * One action for both roles since the mechanics (validate, upload, update
 * one URL column) are identical — only which table/column differs.
 */
export async function uploadProfileMedia(
  _prevState: ProfileMediaState,
  formData: FormData
): Promise<ProfileMediaState> {
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "avatar" && kind !== "banner") {
    return { error: "Invalid request." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Use a JPG, PNG, or WEBP image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 5MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found." };
  }

  let ownerId: string;
  let table: "profiles" | "companies";
  let idColumn: "id" | "profile_id";
  let urlColumn: string;

  if (profile.role === "company") {
    const companyId = await resolveCompanyId(supabase, user.id);
    if (!companyId) {
      return { error: "You're not attached to a company yet." };
    }
    ownerId = companyId;
    table = "companies";
    idColumn = "profile_id";
    urlColumn = kind === "avatar" ? "logo_url" : "banner_url";
  } else {
    ownerId = user.id;
    table = "profiles";
    idColumn = "id";
    urlColumn = kind === "avatar" ? "avatar_url" : "banner_url";
  }

  const path = `${ownerId}/${kind}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("uploadProfileMedia upload failed:", uploadError);
    return { error: "We couldn't upload that image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-media").getPublicUrl(path);
  // Cache-bust so a replaced image shows immediately instead of the old
  // cached one at the same URL.
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: dbError } = await supabase
    .from(table)
    .update({ [urlColumn]: bustedUrl })
    .eq(idColumn, ownerId);

  if (dbError) {
    console.error("uploadProfileMedia db update failed:", dbError);
    return { error: "Your image uploaded, but we couldn't save it to your profile." };
  }

  revalidatePath("/profile");
  revalidatePath("/company/profile");
  revalidatePath("/company/dashboard");
  revalidatePath("/opportunities");
  revalidatePath("/onboarding/identity");
  revalidatePath("/company/onboarding/logo");
  return { success: true };
}
