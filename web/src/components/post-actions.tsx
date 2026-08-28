"use client";

import { useActionState, useState } from "react";
import { deletePost, type PostActionState } from "@/app/actions/posts";
import { removePost, removeComment, type AdminActionState } from "@/app/actions/admin";
import { Button, Input } from "@/components/ui";

export function DeletePostButton({ postId }: { postId: string }) {
  const [, action, pending] = useActionState<PostActionState, FormData>(deletePost, null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this post? This can't be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        disabled={pending}
        className="py-2 font-mono text-xs uppercase tracking-wide text-text-faint hover:text-magenta"
      >
        Delete
      </button>
    </form>
  );
}

export function RemovePostButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(removePost, null);

  if (state && "success" in state) {
    return <span className="font-mono text-xs text-text-faint">Removed</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="py-2 font-mono text-xs uppercase tracking-wide text-magenta"
      >
        Remove (admin)
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="post_id" value={postId} />
      <Input name="reason" placeholder="Reason (optional)" className="w-40 py-1 text-xs" />
      <Button type="submit" variant="secondary" disabled={pending} className="px-3 py-1 text-xs">
        Confirm remove
      </Button>
    </form>
  );
}

export function RemoveCommentButton({ commentId }: { commentId: string }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(removeComment, null);

  if (state && "success" in state) {
    return <span className="font-mono text-xs text-text-faint">Removed</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="comment_id" value={commentId} />
      <button
        type="submit"
        disabled={pending}
        className="py-2 font-mono text-xs uppercase tracking-wide text-magenta"
      >
        Remove (admin)
      </button>
    </form>
  );
}
