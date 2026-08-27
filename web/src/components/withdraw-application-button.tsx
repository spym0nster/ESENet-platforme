"use client";

import { useActionState } from "react";
import {
  withdrawApplication,
  type StatusUpdateState,
} from "@/app/actions/applications";
import { Button } from "@/components/ui";

export function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState<StatusUpdateState, FormData>(
    withdrawApplication,
    null
  );

  if (state && "success" in state) {
    return <span className="font-mono text-xs text-text-faint">Withdrawn</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="application_id" value={applicationId} />
      <Button type="submit" disabled={pending} variant="secondary" className="px-3 py-1.5 text-xs">
        {pending ? "Withdrawing…" : "Withdraw"}
      </Button>
      {state && "error" in state && (
        <span className="ml-2 text-xs text-magenta">{state.error}</span>
      )}
    </form>
  );
}
