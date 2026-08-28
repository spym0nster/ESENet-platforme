"use client";

import { useActionState } from "react";
import { cancelJoinRequest, type OnboardingState } from "@/app/actions/company-onboarding";
import { Card } from "@/components/ui";

export function PendingJoinRequest({
  requestId,
  companyName,
}: {
  requestId: string;
  companyName: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    cancelJoinRequest,
    null
  );

  if (state && "success" in state) return null;

  return (
    <Card className="text-center">
      <p className="font-display text-lg font-bold">Request pending</p>
      <p className="mt-2 text-sm text-text-muted">
        Your request to join <strong className="text-text">{companyName}</strong> is
        waiting on their approval. You&rsquo;ll get access as soon as they accept it.
      </p>
      <form action={action} className="mt-4 inline-block">
        <input type="hidden" name="request_id" value={requestId} />
        <button
          type="submit"
          disabled={pending}
          className="font-mono text-xs uppercase tracking-wide text-text-faint hover:text-magenta"
        >
          {pending ? "…" : "Cancel request"}
        </button>
      </form>
      {state && "error" in state && (
        <p className="mt-2 text-xs text-magenta">{state.error}</p>
      )}
    </Card>
  );
}
