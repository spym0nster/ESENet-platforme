"use client";

import { useActionState } from "react";
import {
  toggleSavedOpportunity,
  type SavedState,
} from "@/app/actions/saved-opportunities";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function SaveOpportunityButton({
  opportunityId,
  initiallySaved,
}: {
  opportunityId: string;
  initiallySaved: boolean;
}) {
  const [state, action, pending] = useActionState<SavedState, FormData>(
    toggleSavedOpportunity,
    null
  );

  // Optimistic-ish: flip the assumed state once the action succeeds.
  const nowSaved = state && "success" in state ? !initiallySaved : initiallySaved;

  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <input type="hidden" name="is_saved" value={String(nowSaved)} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={nowSaved}
        aria-label={nowSaved ? "Remove from saved" : "Save this opportunity"}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-ctrl px-3 font-mono text-xs transition ${
          nowSaved
            ? "text-accent-2"
            : "text-text-faint hover:bg-text/8 hover:text-text"
        }`}
      >
        <BookmarkIcon filled={nowSaved} />
        {pending ? "…" : nowSaved ? "Saved" : "Save"}
      </button>
      {state && "error" in state && (
        <span className="ml-2 text-xs text-magenta">{state.error}</span>
      )}
    </form>
  );
}
