"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CommentActionState = { error: string } | { success: true } | null;

export async function createComment(
  _prevState: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) return { error: "Missing post." };
  if (!body || body.length > 1000) {
    return { error: "Write a comment (up to 1000 characters)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to comment." };

  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
  });

  if (error) {
    console.error("createComment failed:", error);
    return { error: "We couldn't post your comment. Please try again." };
  }

  revalidatePath("/feed");
  return { success: true };
}

export async function deleteComment(
  _prevState: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const commentId = String(formData.get("comment_id") ?? "");
  if (!commentId) return { error: "Missing comment." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS ("authors delete their own comment" / "admins delete any comment")
  // enforces ownership independently.
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);

  if (error) {
    console.error("deleteComment failed:", error);
    return { error: "We couldn't delete that comment." };
  }

  revalidatePath("/feed");
  return { success: true };
}
