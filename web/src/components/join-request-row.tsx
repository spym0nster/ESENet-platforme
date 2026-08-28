"use client";

import { useActionState } from "react";
import {
  approveJoinRequest,
  declineJoinRequest,
  type TeamActionState,
} from "@/app/actions/company-team";
import { Card, Button } from "@/components/ui";

export function JoinRequestRow({
  requestId,
  requesterId,
  requesterName,
  message,
}: {
  requestId: string;
  requesterId: string;
  requesterName: string;
  message: string | null;
}) {
  const [approveState, approveAction, approvePending] = useActionState<
    TeamActionState,
    FormData
  >(approveJoinRequest, null);
  const [declineState, declineAction, declinePending] = useActionState<
    TeamActionState,
    FormData
  >(declineJoinRequest, null);

  if (
    (approveState && "success" in approveState) ||
    (declineState && "success" in declineState)
  ) {
    return null;
  }

  const error =
    (approveState && "error" in approveState && approveState.error) ||
    (declineState && "error" in declineState && declineState.error) ||
    null;

  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{requesterName}</p>
          {message && <p className="mt-1 text-sm text-text-muted">&ldquo;{message}&rdquo;</p>}
        </div>
        <div className="flex items-center gap-2">
          <form action={declineAction}>
            <input type="hidden" name="request_id" value={requestId} />
            <button
              type="submit"
              disabled={approvePending || declinePending}
              className="font-mono text-xs uppercase tracking-wide text-text-faint hover:text-magenta"
            >
              {declinePending ? "…" : "Decline"}
            </button>
          </form>
          <form action={approveAction}>
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="requester_id" value={requesterId} />
            <Button type="submit" disabled={approvePending || declinePending} className="px-3 py-1.5 text-xs">
              {approvePending ? "Approving…" : "Approve"}
            </Button>
          </form>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-magenta">{error}</p>}
    </Card>
  );
}
