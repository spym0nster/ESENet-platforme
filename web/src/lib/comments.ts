import type { SupabaseClient } from "@supabase/supabase-js";

export interface CommentWithAuthor {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  removed_at: string | null;
  author: { id: string; full_name: string; avatar_url: string | null } | null;
}

/**
 * One query per rendered post — fine at this platform's scale (a
 * university community feed, not a high-traffic social network); noted in
 * docs/QA.md as the first thing to batch if the feed ever needs to scale
 * past that.
 */
export async function fetchComments(
  supabase: SupabaseClient,
  postId: string
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      "id, post_id, author_id, body, created_at, removed_at, author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url)"
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("fetchComments failed:", error);
    return [];
  }
  return (data ?? []) as unknown as CommentWithAuthor[];
}
