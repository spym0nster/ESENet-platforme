"use client";

import { useActionState, useState } from "react";
import { createComment, deleteComment, type CommentActionState } from "@/app/actions/comments";
import type { CommentWithAuthor } from "@/lib/comments";
import { Button } from "@/components/ui";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [, action, pending] = useActionState<CommentActionState, FormData>(deleteComment, null);
  return (
    <form action={action}>
      <input type="hidden" name="comment_id" value={commentId} />
      <button
        type="submit"
        disabled={pending}
        className="font-mono text-[11px] uppercase tracking-wide text-text-faint hover:text-magenta"
      >
        Delete
      </button>
    </form>
  );
}

export function CommentSection({
  postId,
  initialComments,
  currentUserId,
  isAdmin,
}: {
  postId: string;
  initialComments: CommentWithAuthor[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [state, action, pending] = useActionState<CommentActionState, FormData>(
    createComment,
    null
  );
  const [draft, setDraft] = useState("");

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {comments
        .filter((c) => !c.removed_at)
        .map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
            <p>
              <span className="font-semibold text-text">{c.author?.full_name ?? "Someone"}</span>{" "}
              <span className="text-text-muted">{c.body}</span>{" "}
              <span className="font-mono text-[11px] text-text-faint">{timeAgo(c.created_at)}</span>
            </p>
            {(c.author_id === currentUserId || isAdmin) && <DeleteCommentButton commentId={c.id} />}
          </div>
        ))}

      {currentUserId && (
        <form
          action={(formData) => {
            const body = String(formData.get("body") ?? "");
            setComments((prev) => [
              ...prev,
              {
                id: `optimistic-${Date.now()}`,
                post_id: postId,
                author_id: currentUserId,
                body,
                created_at: new Date().toISOString(),
                removed_at: null,
                author: null,
              },
            ]);
            setDraft("");
            action(formData);
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="post_id" value={postId} />
          <input
            name="body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            maxLength={1000}
            required
            className="w-full rounded-md border border-border bg-surface p-2 text-sm outline-none focus:border-accent-2"
          />
          <Button type="submit" variant="secondary" disabled={pending} className="px-3 py-2 text-xs">
            Post
          </Button>
        </form>
      )}
      {state && "error" in state && <p className="text-xs text-magenta">{state.error}</p>}
    </div>
  );
}
