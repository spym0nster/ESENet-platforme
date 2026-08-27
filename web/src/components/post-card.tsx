import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostWithAuthor } from "@/types/database";
import { fetchComments } from "@/lib/comments";
import { Card, Badge } from "@/components/ui";
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import { ReportButton } from "@/components/report-button";
import { DeletePostButton, RemovePostButton } from "@/components/post-actions";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export async function PostCard({
  supabase,
  post,
  currentUserId,
  isAdmin,
}: {
  supabase: SupabaseClient;
  post: PostWithAuthor;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const comments = await fetchComments(supabase, post.id);

  const postingAsCompany = post.published_as === "company" && post.company;
  const isOwnPost = currentUserId === post.author_id;

  return (
    <Card>
      <div className="flex items-start gap-3">
        {postingAsCompany ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={post.company!.logo_url ?? undefined}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full bg-surface-alt object-cover"
          />
        ) : post.author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={post.author.avatar_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-full bg-surface-alt" />
        )}

        <div className="min-w-0 flex-1">
          {postingAsCompany ? (
            <p className="flex items-center gap-2 font-semibold text-text">
              {post.company!.company_name}
              {post.company!.verified && <Badge variant="info">Verified</Badge>}
            </p>
          ) : (
            <p className="font-semibold text-text">
              {post.author?.full_name ?? "Deleted user"}
              {post.company && (
                <span className="font-normal text-text-muted">
                  {" · "}
                  {post.member_title ? `${post.member_title} · ` : ""}
                  {post.company.company_name}
                </span>
              )}
            </p>
          )}
          <p className="font-mono text-xs text-text-faint">
            {!postingAsCompany && post.author?.headline ? `${post.author.headline} · ` : ""}
            {timeAgo(post.created_at)}
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm text-text">{post.body}</p>

          {post.media_url && (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
            <img
              src={post.media_url}
              alt=""
              className="mt-3 max-h-96 w-full rounded-md border border-border object-cover"
            />
          )}

          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block truncate text-sm text-accent-2 hover:text-text"
            >
              {post.link_url}
            </a>
          )}

          {post.opportunity && (
            <Link
              href={`/opportunities/${post.opportunity.id}`}
              className="mt-3 block rounded-md border border-border bg-surface-alt p-3 text-sm hover:border-accent-2"
            >
              <span className="font-mono text-[11px] uppercase tracking-wide text-accent-2">
                {TYPE_LABEL[post.opportunity.type] ?? post.opportunity.type}
              </span>
              <p className="font-semibold text-text">{post.opportunity.title} →</p>
            </Link>
          )}

          {post.project && (
            <div className="mt-3 rounded-md border border-border bg-surface-alt p-3 text-sm">
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
                Project
              </span>
              <p className="font-semibold text-text">{post.project.title}</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <LikeButton postId={post.id} initialLiked={post.liked_by_me} initialCount={post.like_count} />
            <span className="font-mono text-xs text-text-faint">
              {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              {isOwnPost && <DeletePostButton postId={post.id} />}
              {isAdmin && !isOwnPost && <RemovePostButton postId={post.id} />}
              {currentUserId && !isOwnPost && <ReportButton postId={post.id} />}
            </div>
          </div>

          <CommentSection
            postId={post.id}
            initialComments={comments}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </Card>
  );
}
