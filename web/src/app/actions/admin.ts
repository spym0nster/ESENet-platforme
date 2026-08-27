"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = { error: string } | { success: true } | null;

/**
 * Verifies a company (single-admin manual approval — no ML/automated fraud
 * detection, matching ESEN's institutional scale). Auth + role are checked
 * server-side here as defense in depth; RLS ("admins verify companies")
 * enforces the same rule independently at the database layer.
 */
export async function verifyCompany(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const companyProfileId = String(formData.get("company_profile_id") ?? "");
  if (!companyProfileId) {
    return { error: "Missing company." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in as an admin." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "You don't have permission to verify companies." };
  }

  const { error } = await supabase
    .from("companies")
    .update({ verified: true })
    .eq("profile_id", companyProfileId);

  if (error) {
    console.error("verifyCompany failed:", error);
    return { error: "We couldn't verify this company. Please try again." };
  }

  revalidatePath("/admin/companies");
  revalidatePath("/opportunities");
  return { success: true };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "You must be signed in as an admin." } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase, user: null, error: "You don't have permission to do this." } as const;
  }

  return { supabase, user, error: null } as const;
}

/** Soft-delete moderation: the post stays in the DB (audit trail via
 * removed_by/removal_reason) but every "publicly readable" SELECT policy
 * excludes it. RLS ("admins moderate posts") + the protect_post_admin_fields
 * trigger enforce this is admin-only independently at the DB layer. */
export async function removePost(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const postId = String(formData.get("post_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!postId) return { error: "Missing post." };

  const { supabase, user, error: authError } = await requireAdmin();
  if (!user) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase
    .from("posts")
    .update({ removed_at: new Date().toISOString(), removed_by: user.id, removal_reason: reason || null })
    .eq("id", postId);

  if (error) {
    console.error("removePost failed:", error);
    return { error: "We couldn't remove that post." };
  }

  revalidatePath("/feed");
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function removeComment(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const commentId = String(formData.get("comment_id") ?? "");
  if (!commentId) return { error: "Missing comment." };

  const { supabase, user, error: authError } = await requireAdmin();
  if (!user) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase
    .from("post_comments")
    .update({ removed_at: new Date().toISOString(), removed_by: user.id })
    .eq("id", commentId);

  if (error) {
    console.error("removeComment failed:", error);
    return { error: "We couldn't remove that comment." };
  }

  revalidatePath("/feed");
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function resolveReport(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const reportId = String(formData.get("report_id") ?? "");
  const status = String(formData.get("status") ?? "resolved");
  if (!reportId) return { error: "Missing report." };
  if (status !== "resolved" && status !== "dismissed") return { error: "Invalid status." };

  const { supabase, user, error: authError } = await requireAdmin();
  if (!user) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase
    .from("content_reports")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", reportId);

  if (error) {
    console.error("resolveReport failed:", error);
    return { error: "We couldn't update that report." };
  }

  revalidatePath("/admin/reports");
  return { success: true };
}
