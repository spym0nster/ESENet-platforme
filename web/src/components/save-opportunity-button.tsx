"use client";

import { useActionState } from "react";
import {
  toggleSavedOpportunity,
  type SavedState,
} from "@/app/actions/saved-opportunities";

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

  // Optimistic-ish: flip the assumed state once the action succeeds: on
  // success, "is_saved" toggles, showing the opposite label after resubmit.
  const nowSaved = state && "success" in state ? !initiallySaved : initiallySaved;

  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <input type="hidden" name="is_saved" value={String(nowSaved)} />
      <button
        type="submit"
        disabled={pending}
        className={`py-2 font-mono text-xs ${nowSaved ? "text-accent-2" : "text-text-faint hover:text-accent-2"}`}
        aria-label={nowSaved ? "Unsave opportunity" : "Save opportunity"}
      >
        {pending ? "…" : nowSaved ? "★ Saved" : "☆ Save"}
      </button>
      {state && "error" in state && (
        <span className="ml-2 text-xs text-magenta">{state.error}</span>
      )}
    </form>
  );
}
