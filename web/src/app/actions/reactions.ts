"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReactionState = { error: string } | { liked: boolean } | null;

/**
 * Toggles the current user's like on a post. The (post_id, profile_id)
 * primary key on post_likes is what actually prevents duplicate likes —
 * this just decides insert vs delete for the current state.
 */
export async function toggleLike(postId: string): Promise<ReactionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
    if (error) return { error: "Couldn't update your like." };
    revalidatePath("/feed");
    return { liked: false };
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, profile_id: user.id });
  if (error) return { error: "Couldn't update your like." };
  revalidatePath("/feed");
  return { liked: true };
}
