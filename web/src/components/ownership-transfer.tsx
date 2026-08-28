"use client";

import { useActionState } from "react";
import {
  cancelOwnershipTransfer,
  acceptOwnershipTransfer,
  declineOwnershipTransfer,
  type TeamActionState,
} from "@/app/actions/company-team";
import { Card, Button } from "@/components/ui";

/** Shown to the owner who initiated a still-pending transfer. */
export function PendingOwnershipTransferRow({
  transferId,
  toName,
}: {
  transferId: string;
  toName: string;
}) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    cancelOwnershipTransfer,
    null
  );

  if (state && "success" in state) return null;

  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          Waiting on <strong className="text-text">{toName}</strong> to
          accept ownership.
        </p>
        <form action={action}>
          <input type="hidden" name="transfer_id" value={transferId} />
          <button
            type="submit"
            disabled={pending}
            className="py-2 font-mono text-xs uppercase tracking-wide text-text-faint hover:text-magenta"
          >
            {pending ? "…" : "Cancel"}
          </button>
        </form>
      </div>
      {state && "error" in state && (
        <p className="mt-2 text-xs text-magenta">{state.error}</p>
      )}
    </Card>
  );
}

/** Shown to the person a transfer was offered to. */
export function IncomingOwnershipTransfer({
  transferId,
  companyName,
}: {
  transferId: string;
  companyName: string;
}) {
  const [acceptState, acceptAction, acceptPending] = useActionState<
    TeamActionState,
    FormData
  >(acceptOwnershipTransfer, null);
  const [declineState, declineAction, declinePending] = useActionState<
    TeamActionState,
    FormData
  >(declineOwnershipTransfer, null);

  if (
    (acceptState && "success" in acceptState) ||
    (declineState && "success" in declineState)
  ) {
    return null;
  }

  const error =
    (acceptState && "error" in acceptState && acceptState.error) ||
    (declineState && "error" in declineState && declineState.error) ||
    null;

  return (
    <Card className="border-accent/50 bg-accent-soft p-4">
      <p className="text-sm">
        <strong className="text-text">{companyName}</strong>&rsquo;s current
        owner wants to make you the owner.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <form action={declineAction}>
          <input type="hidden" name="transfer_id" value={transferId} />
          <button
            type="submit"
            disabled={acceptPending || declinePending}
            className="py-2 font-mono text-xs uppercase tracking-wide text-text-faint hover:text-magenta"
          >
            {declinePending ? "…" : "Decline"}
          </button>
        </form>
        <form
          action={acceptAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `Accept ownership of ${companyName}? The current owner will become a regular member.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="transfer_id" value={transferId} />
          <Button type="submit" disabled={acceptPending || declinePending} className="px-3 py-2 text-xs">
            {acceptPending ? "Accepting…" : "Accept ownership"}
          </Button>
        </form>
      </div>
      {error && <p className="mt-2 text-xs text-magenta">{error}</p>}
    </Card>
  );
}
