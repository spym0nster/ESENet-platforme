"use client";

import { useActionState } from "react";
import {
  setOpportunityStatus,
  type StatusToggleState,
} from "@/app/actions/opportunities";

/**
 * Close a published opportunity, or reopen a closed one. A closed
 * opportunity stops accepting applications and drops off the student
 * marketplace, but stays on the company dashboard with its applicant list.
 */
export function OpportunityStatusButton({
  opportunityId,
  status,
}: {
  opportunityId: string;
  status: "published" | "closed" | "pending";
}) {
  const [state, action, pending] = useActionState<StatusToggleState, FormData>(
    setOpportunityStatus,
    null
  );

  // Nothing to toggle for a 'pending' row (not a state this app sets today).
  if (status === "pending") return null;

  const next = status === "published" ? "closed" : "published";
  const label = status === "published" ? "Close" : "Reopen";

  return (
    <form action={action} className="inline">
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <input type="hidden" name="status" value={next} />
      <button
        type="submit"
        disabled={pending}
        className="py-2 font-mono text-xs text-text-muted hover:text-text disabled:opacity-60"
      >
        {pending ? "…" : label}
      </button>
      {state && "error" in state && (
        <span className="ml-2 text-xs text-magenta">{state.error}</span>
      )}
    </form>
  );
}
