"use client";

import { useActionState, useState } from "react";
import {
  createComment,
  deleteComment,
  editComment,
  type CommentActionState,
} from "@/app/actions/comments";
import { RemoveCommentButton } from "@/components/post-actions";
import type { CommentWithAuthor } from "@/lib/comments";
import { Button, Input } from "@/components/ui";

const VISIBLE = 3;

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
        className="py-1 font-mono text-[11px] uppercase tracking-widest text-text-faint hover:text-magenta"
      >
        Delete
      </button>
    </form>
  );
}

function CommentRow({
  comment,
  currentUserId,
  isAdmin,
}: {
  comment: CommentWithAuthor;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const isOwn = comment.author_id === currentUserId;
  const [editingFrom, setEditingFrom] = useState<string | null>(null);
  const [state, action, pending] = useActionState<CommentActionState, FormData>(
    editComment,
    null
  );
  // Closes itself once the successful edit revalidates (see PostBody).
  const editing = editingFrom !== null && editingFrom === comment.body;

  if (editing) {
    return (
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="comment_id" value={comment.id} />
        <Input name="body" defaultValue={comment.body} maxLength={1000} required />
        <Button type="submit" size="compact" variant="secondary" disabled={pending}>
          {pending ? "…" : "Save"}
        </Button>
        <Button
          type="button"
          size="compact"
          variant="ghost"
          onClick={() => setEditingFrom(null)}
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <p className="min-w-0">
        <span className="font-semibold text-text">
          {comment.author?.full_name ?? "Someone"}
        </span>{" "}
        <span className="text-text/[0.88]">{comment.body}</span>{" "}
        <span className="whitespace-nowrap font-mono text-[11px] text-text-faint">
          {timeAgo(comment.created_at)}
          {comment.edited_at ? " · edited" : ""}
        </span>
        {state && "error" in state && (
          <span className="ml-2 text-[11px] text-magenta">{state.error}</span>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {isOwn && (
          <>
            <button
              type="button"
              onClick={() => setEditingFrom(comment.body)}
              className="py-1 font-mono text-[11px] uppercase tracking-widest text-text-faint hover:text-text"
            >
              Edit
            </button>
            <DeleteCommentButton commentId={comment.id} />
          </>
        )}
        {isAdmin && !isOwn && <RemoveCommentButton commentId={comment.id} />}
      </div>
    </div>
  );
}

export function CommentSection({
  postId,
  initialComments,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  postId: string;
  initialComments: CommentWithAuthor[];
  currentUserId: string | null;
  currentUserName?: string | null;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [state, action, pending] = useActionState<CommentActionState, FormData>(
    createComment,
    null
  );
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Reconcile with fresh server data on the parent's re-fetch (see the long
  // note this replaced — same "adjust state during render" pattern).
  const [prevInitial, setPrevInitial] = useState(initialComments);
  if (initialComments !== prevInitial) {
    setPrevInitial(initialComments);
    setComments(initialComments);
  }

  const live = comments.filter((c) => !c.removed_at);
  const hidden = Math.max(0, live.length - VISIBLE);
  const shown = showAll ? live : live.slice(-VISIBLE);

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {hidden > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="font-mono text-[11px] uppercase tracking-widest text-accent-2 hover:text-text"
        >
          Show {hidden} earlier {hidden === 1 ? "comment" : "comments"}
        </button>
      )}

      {shown.map((c) => (
        <CommentRow
          key={c.id}
          comment={c}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
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
                edited_at: null,
                removed_at: null,
                author: currentUserName
                  ? { id: currentUserId, full_name: currentUserName, avatar_url: null }
                  : null,
              },
            ]);
            setDraft("");
            setShowAll(true);
            action(formData);
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="post_id" value={postId} />
          <Input
            name="body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment"
            maxLength={1000}
            required
          />
          <Button type="submit" size="compact" variant="secondary" disabled={pending}>
            Post
          </Button>
        </form>
      )}
      {state && "error" in state && <p className="text-xs text-magenta">{state.error}</p>}
    </div>
  );
}
