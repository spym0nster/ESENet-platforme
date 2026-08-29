import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostWithAuthor, UserRole, OpportunityType } from "@/types/database";

const PAGE_SIZE = 10;

type RawPost = {
  id: string;
  author_id: string;
  company_id: string | null;
  published_as: "self" | "company";
  body: string;
  media_url: string | null;
  link_url: string | null;
  opportunity_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  removed_at: string | null;
  removed_by: string | null;
  removal_reason: string | null;
  author: { id: string; full_name: string; avatar_url: string | null; role: UserRole } | null;
  company: { profile_id: string; company_name: string; logo_url: string | null; verified: boolean } | null;
  opportunity: { id: string; title: string; type: OpportunityType } | null;
  project: { id: string; title: string } | null;
};

/**
 * Fetches a page of posts plus everything the feed/profile UI needs to
 * render them (author, company context, member title, like/comment counts,
 * whether the current viewer liked it) in a small, fixed number of queries
 * regardless of page size — not one round trip per post per section 29's
 * "don't download the whole database" requirement.
 */
export async function fetchPosts(
  supabase: SupabaseClient,
  opts: {
    currentUserId: string | null;
    authorId?: string;
    companyId?: string;
    /** restrict to posts published in a given voice — the company page's
     *  "Posts" tab is company-voice only, and its count must page from the
     *  same filtered set or the two disagree once a member has also posted
     *  personally. */
    publishedAs?: "self" | "company";
    /** drop soft-deleted rows in the query (not client-side) so a page of
     *  N and a head-count of N line up. The feed leaves this off — it shows
     *  tombstones to admins. */
    excludeRemoved?: boolean;
    before?: string; // ISO created_at cursor, exclusive
  }
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  let query = supabase
    .from("posts")
    .select(
      `id, author_id, company_id, published_as, body, media_url, link_url,
       opportunity_id, project_id, created_at, updated_at,
       removed_at, removed_by, removal_reason,
       author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role),
       company:companies(profile_id, company_name, logo_url, verified),
       opportunity:opportunities(id, title, type),
       project:projects(id, title)`
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (opts.authorId) query = query.eq("author_id", opts.authorId);
  if (opts.companyId) query = query.eq("company_id", opts.companyId);
  if (opts.publishedAs) query = query.eq("published_as", opts.publishedAs);
  if (opts.excludeRemoved) query = query.is("removed_at", null);
  if (opts.before) query = query.lt("created_at", opts.before);

  const { data, error } = await query;
  if (error) {
    console.error("fetchPosts failed:", error);
    return { posts: [], nextCursor: null };
  }

  const rows = (data ?? []) as unknown as RawPost[];
  if (rows.length === 0) return { posts: [], nextCursor: null };

  const postIds = rows.map((r) => r.id);
  const companyPairs = rows.filter((r) => r.company_id).map((r) => ({ company_id: r.company_id!, author_id: r.author_id }));
  const companyIds = [...new Set(companyPairs.map((p) => p.company_id))];

  const studentAuthorIds = [...new Set(rows.filter((r) => r.author?.role === "student").map((r) => r.author_id))];

  const [likesRes, commentsRes, membersRes, headlinesRes] = await Promise.all([
    supabase.from("post_likes").select("post_id, profile_id").in("post_id", postIds),
    supabase.from("post_comments").select("post_id").is("removed_at", null).in("post_id", postIds),
    companyIds.length
      ? supabase.from("company_members").select("company_id, profile_id, title").in("company_id", companyIds)
      : Promise.resolve({ data: [] as { company_id: string; profile_id: string; title: string | null }[] }),
    studentAuthorIds.length
      ? supabase.from("student_details").select("profile_id, headline").in("profile_id", studentAuthorIds)
      : Promise.resolve({ data: [] as { profile_id: string; headline: string | null }[] }),
  ]);

  const headlineByAuthor = new Map<string, string | null>();
  for (const h of headlinesRes.data ?? []) headlineByAuthor.set(h.profile_id, h.headline);

  const likesByPost = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likesRes.data ?? []) {
    likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
    if (opts.currentUserId && like.profile_id === opts.currentUserId) likedByMe.add(like.post_id);
  }

  const commentsByPost = new Map<string, number>();
  for (const c of commentsRes.data ?? []) {
    commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) ?? 0) + 1);
  }

  const titleByCompanyAndAuthor = new Map<string, string | null>();
  for (const m of membersRes.data ?? []) {
    titleByCompanyAndAuthor.set(`${m.company_id}:${m.profile_id}`, m.title);
  }

  const posts: PostWithAuthor[] = rows.map((r) => ({
    id: r.id,
    author_id: r.author_id,
    company_id: r.company_id,
    published_as: r.published_as,
    body: r.body,
    media_url: r.media_url,
    link_url: r.link_url,
    opportunity_id: r.opportunity_id,
    project_id: r.project_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    removed_at: r.removed_at,
    removed_by: r.removed_by,
    removal_reason: r.removal_reason,
    author: r.author
      ? { ...r.author, headline: headlineByAuthor.get(r.author_id) ?? null }
      : null,
    company: r.company,
    member_title: r.company_id ? titleByCompanyAndAuthor.get(`${r.company_id}:${r.author_id}`) ?? null : null,
    opportunity: r.opportunity,
    project: r.project,
    like_count: likesByPost.get(r.id) ?? 0,
    comment_count: commentsByPost.get(r.id) ?? 0,
    liked_by_me: likedByMe.has(r.id),
  }));

  const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null;
  return { posts, nextCursor };
}
