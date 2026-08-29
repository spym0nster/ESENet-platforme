import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostWithAuthor } from "@/types/database";
import { fetchComments } from "@/lib/comments";
import { Card, Badge, Avatar, CompanyLogo } from "@/components/ui";
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import { ReportButton } from "@/components/report-button";
import { DeletePostButton, RemovePostButton } from "@/components/post-actions";
import { PostBody } from "@/components/post-body";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

const TYPE_TONE: Record<string, "neutral" | "cyan" | "violet" | "magenta"> = {
  internship: "cyan",
  alternance: "cyan",
  pfe: "violet",
  job: "magenta",
  freelance: "neutral",
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function PostCard({
  supabase,
  post,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  supabase: SupabaseClient;
  post: PostWithAuthor;
  currentUserId: string | null;
  currentUserName?: string | null;
  isAdmin: boolean;
}) {
  const comments = await fetchComments(supabase, post.id);

  const asCompany = post.published_as === "company" && post.company;
  const isOwnPost = currentUserId === post.author_id;
  const isEdited = post.updated_at !== post.created_at;

  return (
    <Card className="p-6">
      {/* one identity line — name is the peak, everything else steps down */}
      <div className="flex items-center gap-3">
        {asCompany ? (
          <CompanyLogo name={post.company!.company_name} src={post.company!.logo_url} size="sm" />
        ) : (
          <Avatar name={post.author?.full_name ?? "?"} src={post.author?.avatar_url} />
        )}

        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            {asCompany ? (
              <>
                <Link
                  href={`/companies/${post.company!.profile_id}`}
                  className="font-semibold text-text hover:text-accent-2"
                >
                  {post.company!.company_name}
                </Link>
                {post.company!.verified && <Badge tone="cyan">Verified</Badge>}
              </>
            ) : (
              <>
                <span className="font-semibold text-text">
                  {post.author?.full_name ?? "Deleted user"}
                </span>
                {(post.member_title || post.company) && (
                  <span className="text-text-faint">
                    {post.member_title ?? "member"}
                    {post.company && (
                      <>
                        {" · "}
                        <Link
                          href={`/companies/${post.company.profile_id}`}
                          className="hover:text-accent-2"
                        >
                          {post.company.company_name}
                        </Link>
                      </>
                    )}
                  </span>
                )}
              </>
            )}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-text-faint">
            {!asCompany && post.author?.headline ? `${post.author.headline} · ` : ""}
            {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      <PostBody
        postId={post.id}
        body={post.body}
        linkUrl={post.link_url}
        isEdited={isEdited}
        canEdit={isOwnPost}
      />

      {post.media_url && (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img
          src={post.media_url}
          alt=""
          className="mt-3 max-h-96 w-full rounded-ctrl border border-border object-cover"
        />
      )}

      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-2 rounded-ctrl border border-border bg-bg-2 p-3 text-sm transition hover:border-border-strong"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-faint" aria-hidden>
            <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
            <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
          </svg>
          <span className="truncate text-text-muted">{hostOf(post.link_url)}</span>
        </a>
      )}

      {post.opportunity && (
        <Link
          href={`/opportunities/${post.opportunity.id}`}
          className="mt-3 flex items-center gap-3 rounded-ctrl border border-border bg-bg-2 p-3 transition hover:border-accent/45"
        >
          <Badge tone={TYPE_TONE[post.opportunity.type] ?? "neutral"}>
            {TYPE_LABEL[post.opportunity.type] ?? post.opportunity.type}
          </Badge>
          <span className="truncate text-sm font-semibold text-text">
            {post.opportunity.title}
          </span>
        </Link>
      )}

      {post.project && (
        <div className="mt-3 rounded-ctrl border border-border bg-bg-2 p-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
            Project
          </span>
          <p className="text-sm font-semibold text-text">{post.project.title}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-1 border-t border-border pt-2 text-xs text-text-faint">
        <LikeButton
          postId={post.id}
          initialLiked={post.liked_by_me}
          initialCount={post.like_count}
        />
        <span className="px-2 font-mono">
          {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
        </span>
        <span className="ml-auto flex items-center gap-3">
          {isOwnPost && <DeletePostButton postId={post.id} />}
          {isAdmin && !isOwnPost && <RemovePostButton postId={post.id} />}
          {currentUserId && !isOwnPost && <ReportButton postId={post.id} />}
        </span>
      </div>

      <CommentSection
        postId={post.id}
        initialComments={comments}
        currentUserId={currentUserId}
        currentUserName={currentUserName ?? null}
        isAdmin={isAdmin}
      />
    </Card>
  );
}
