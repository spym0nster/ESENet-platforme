"use client";

import { useActionState } from "react";
import { applyToOpportunity, type ApplyState } from "@/app/actions/applications";

export function ApplyForm({
  opportunityId,
  alreadyApplied,
}: {
  opportunityId: string;
  alreadyApplied: boolean;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    applyToOpportunity,
    null
  );

  if (alreadyApplied || (state && "success" in state)) {
    return (
      <p
        className="rounded-md px-4 py-3 text-sm font-medium"
        style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
      >
        You&apos;ve applied to this opportunity.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <textarea
        name="message"
        placeholder="A short note to the recruiter (optional)"
        rows={3}
        className="w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-accent-2"
      />
      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-5 py-2.5 font-mono text-sm text-white disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply →"}
      </button>
    </form>
  );
}
