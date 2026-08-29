"use client";

import { useState } from "react";
import { useActionState } from "react";
import { editPost, type PostActionState } from "@/app/actions/posts";
import { Button, Input, Textarea } from "@/components/ui";

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
        <Textarea name="body" defaultValue={body} rows={4} maxLength={3000} />
        <Input
          name="link_url"
          type="url"
          defaultValue={linkUrl ?? ""}
          placeholder="Link (optional)"
        />
        {state && "error" in state && (
          <p className="text-xs text-magenta">{state.error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" size="compact" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setEditingFrom(null)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-text/[0.88]">
        {body}
      </p>
      {(isEdited || canEdit) && (
        <p className="mt-1 flex items-center gap-3 font-mono text-[11px] text-text-faint">
          {isEdited && <span>edited</span>}
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditingFrom(body)}
              className="uppercase tracking-widest hover:text-text"
            >
              Edit
            </button>
          )}
        </p>
      )}
    </>
  );
}
