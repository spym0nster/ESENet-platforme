"use client";

import { useState } from "react";
import { useActionState } from "react";
import { editPost, type PostActionState } from "@/app/actions/posts";
import { Button } from "@/components/ui";

export function PostBody({
  postId,
  body,
  linkUrl,
  isEdited,
  canEdit,
}: {
  postId: string;
  body: string;
  linkUrl: string | null;
  isEdited: boolean;
  canEdit: boolean;
}) {
  // We start editing "from" a specific version of the body. Once the server
  // action succeeds, `revalidatePath` re-renders this card with the new
  // `body` prop — `editingFrom` no longer matches, so the form closes on its
  // own without a setState-in-effect. Cancel clears it explicitly.
  const [editingFrom, setEditingFrom] = useState<string | null>(null);
  const [state, action, pending] = useActionState<PostActionState, FormData>(
    editPost,
    null
  );
  const editing = editingFrom !== null && editingFrom === body;

  if (editing) {
    return (
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="post_id" value={postId} />
        <textarea
          name="body"
          defaultValue={body}
          rows={4}
          maxLength={3000}
          className="w-full rounded-md border border-border bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
        />
        <input
          name="link_url"
          type="url"
          defaultValue={linkUrl ?? ""}
          placeholder="Link (optional)"
          className="w-full rounded-md border border-border bg-surface p-2 text-xs outline-none focus:border-accent-2"
        />
        {state && "error" in state && (
          <p className="text-xs text-magenta">{state.error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending} className="px-3 py-1.5 text-xs">
            {pending ? "Saving…" : "Save"}
          </Button>
          <button
            type="button"
            onClick={() => setEditingFrom(null)}
            className="py-1.5 font-mono text-xs text-text-faint hover:text-text"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <p className="mt-2 whitespace-pre-wrap text-sm text-text">{body}</p>
      {(isEdited || canEdit) && (
        <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-text-faint">
          {isEdited && <span>edited</span>}
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditingFrom(body)}
              className="uppercase tracking-wide hover:text-text"
            >
              Edit
            </button>
          )}
        </p>
      )}
    </>
  );
}
