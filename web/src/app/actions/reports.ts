"use server";

import { createClient } from "@/lib/supabase/server";
import type { ReportReason } from "@/types/database";

export type ReportActionState = { error: string } | { success: true } | null;

const VALID_REASONS: ReportReason[] = [
  "spam",
  "harassment",
  "inappropriate",
  "fake_information",
  "recruitment_abuse",
  "other",
];

export async function createReport(
  _prevState: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  const postId = String(formData.get("post_id") ?? "").trim() || null;
  const commentId = String(formData.get("comment_id") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "").trim();

  if (!postId && !commentId) return { error: "Missing content to report." };
  if (postId && commentId) return { error: "Invalid report." };
  if (!VALID_REASONS.includes(reason as ReportReason)) {
    return { error: "Choose a reason." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to report content." };

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    post_id: postId,
    comment_id: commentId,
    reason,
    details: details || null,
  });

  if (error) {
    console.error("createReport failed:", error);
    return { error: "We couldn't submit your report. Please try again." };
  }

  return { success: true };
}
