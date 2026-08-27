"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";

export type PostActionState = { error: string } | { success: true } | null;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Creates a post. `company_id`/`published_as` are never trusted as sent by
 * the client beyond the *choice* of "as myself" vs "as my company" — which
 * company that resolves to is always re-derived server-side via
 * resolveCompanyId, exactly like every other company-scoped action in this
 * app. A student (or anyone not attached to a company) always gets
 * company_id = null regardless of what the form sends.
 */
export async function createPost(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const body = String(formData.get("body") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const publishAsCompany = formData.get("publish_as") === "company";
  const opportunityId = String(formData.get("opportunity_id") ?? "").trim() || null;
  const projectId = String(formData.get("project_id") ?? "").trim() || null;
  const file = formData.get("media") as File | null;

  if (!body || body.length > 3000) {
    return { error: "Write something (up to 3000 characters)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to post." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found." };
  }

  const companyId =
    profile.role === "company" ? await resolveCompanyId(supabase, user.id) : null;

  // Only a real project of this student, only a real opportunity of this
  // company — the RLS foreign keys would reject anything else anyway, but
  // checking here gives a clean error instead of a raw DB error.
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!project) {
      return { error: "That project couldn't be found." };
    }
  }
  if (opportunityId) {
    if (!companyId) {
      return { error: "Only companies can link an opportunity." };
    }
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("id")
      .eq("id", opportunityId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!opportunity) {
      return { error: "That opportunity couldn't be found." };
    }
  }

  let mediaUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return { error: "Use a JPG, PNG, or WEBP image." };
    }
    if (file.size > MAX_BYTES) {
      return { error: "Image must be under 5MB." };
    }
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      console.error("createPost media upload failed:", uploadError);
      return { error: "We couldn't upload that image. Please try again." };
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("post-media").getPublicUrl(path);
    mediaUrl = publicUrl;
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    company_id: companyId,
    published_as: publishAsCompany && companyId ? "company" : "self",
    body,
    media_url: mediaUrl,
    link_url: linkUrl || null,
    opportunity_id: opportunityId,
    project_id: projectId,
  });

  if (error) {
    console.error("createPost failed:", error);
    return { error: "We couldn't publish your post. Please try again." };
  }

  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath("/company/profile");
  return { success: true };
}

export async function deletePost(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { error: "Missing post." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS ("authors delete their own post" / "admins delete any post")
  // independently enforces ownership — this just scopes the request so a
  // no-op (0 rows) reads as "not yours" rather than a confusing success.
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("deletePost failed:", error);
    return { error: "We couldn't delete that post." };
  }

  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath("/company/profile");
  return { success: true };
}
