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
        className="py-2 font-mono text-[11px] uppercase tracking-wide text-text-faint hover:text-magenta"
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
  // Closes itself once the successful edit revalidates and the new body
  // arrives as a prop — no setState-in-effect (see PostBody for the same
  // pattern).
  const editing = editingFrom !== null && editingFrom === comment.body;

  if (editing) {
    return (
      <form action={action} className="flex items-center gap-2 text-sm">
        <input type="hidden" name="comment_id" value={comment.id} />
        <input
          name="body"
          defaultValue={comment.body}
          maxLength={1000}
          required
          className="w-full rounded-md border border-border bg-surface p-2 text-sm outline-none focus:border-accent-2"
        />
        <Button type="submit" variant="secondary" disabled={pending} className="px-3 py-2 text-xs">
          {pending ? "…" : "Save"}
        </Button>
        <button
          type="button"
          onClick={() => setEditingFrom(null)}
          className="py-2 font-mono text-[11px] uppercase tracking-wide text-text-faint hover:text-text"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <p>
        <span className="font-semibold text-text">{comment.author?.full_name ?? "Someone"}</span>{" "}
        <span className="text-text-muted">{comment.body}</span>{" "}
        <span className="font-mono text-[11px] text-text-faint">
          {timeAgo(comment.created_at)}
          {comment.edited_at ? " · edited" : ""}
        </span>
        {state && "error" in state && (
          <span className="ml-2 text-[11px] text-magenta">{state.error}</span>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {isOwn && (
          <>
            <button
              type="button"
              onClick={() => setEditingFrom(comment.body)}
              className="py-2 font-mono text-[11px] uppercase tracking-wide text-text-faint hover:text-text"
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

  // Reconcile with fresh server data whenever the parent Server Component
  // re-fetches (e.g. after revalidatePath from a delete/remove/edit action).
  // Without this, this component's own useState keeps rendering whatever
  // list it mounted with — a deleted/removed comment lingers on screen
  // until a full page reload even though the server-side delete succeeded.
  // Adjusting state during render (React's documented pattern for this,
  // see "Adjusting state when a prop changes") rather than in a useEffect —
  // it applies before the stale list ever paints, and ESLint's
  // react-hooks/set-state-in-effect rule flags the effect version anyway.
  const [prevInitialComments, setPrevInitialComments] = useState(initialComments);
  if (initialComments !== prevInitialComments) {
    setPrevInitialComments(initialComments);
    setComments(initialComments);
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {comments
        .filter((c) => !c.removed_at)
        .map((c) => (
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
