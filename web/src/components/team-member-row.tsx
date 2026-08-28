"use client";

import { useActionState } from "react";
import {
  removeTeamMember,
  cancelInvite,
  initiateOwnershipTransfer,
  type TeamActionState,
} from "@/app/actions/company-team";
import { Card, Badge } from "@/components/ui";

export function TeamMemberRow({
  name,
  role,
  canRemove,
  canTransferTo,
  memberId,
}: {
  name: string;
  role: "owner" | "member";
  canRemove: boolean;
  canTransferTo: boolean;
  memberId: string;
}) {
  const [removeState, removeAction, removePending] = useActionState<
    TeamActionState,
    FormData
  >(removeTeamMember, null);
  const [transferState, transferAction, transferPending] = useActionState<
    TeamActionState,
    FormData
  >(initiateOwnershipTransfer, null);

  // Only a real removal means this member is gone — hide the row. A
  // successful transfer *initiation* doesn't remove anyone from the
  // company; the "Make owner" button hiding itself (canTransferTo turns
  // false once a transfer exists, via the next server render) is enough.
  if (removeState && "success" in removeState) {
    return null;
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{name}</p>
        <Badge variant={role === "owner" ? "info" : "neutral"}>{role}</Badge>
      </div>
      <div className="flex items-center gap-3">
        {canTransferTo && (
          <form
            action={transferAction}
            onSubmit={(e) => {
              if (
                !confirm(
                  `Make ${name} the owner of this company? You'll become a regular member once they accept.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="to_profile_id" value={memberId} />
            <button
              type="submit"
              disabled={transferPending}
              className="py-2 font-mono text-xs text-accent-2 hover:text-text"
            >
              {transferPending ? "…" : "Make owner"}
            </button>
          </form>
        )}
        {canRemove && (
          <form action={removeAction}>
            <input type="hidden" name="member_id" value={memberId} />
            <button
              type="submit"
              disabled={removePending}
              className="py-2 font-mono text-xs text-text-faint hover:text-magenta"
            >
              {removePending ? "…" : "Remove"}
            </button>
          </form>
        )}
      </div>
      {transferState && "error" in transferState && (
        <p className="text-xs text-magenta">{transferState.error}</p>
      )}
    </Card>
  );
}

export function PendingInviteRow({ email, inviteId }: { email: string; inviteId: string }) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    cancelInvite,
    null
  );

  if (state && "success" in state) return null;

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{email}</p>
        <Badge variant="neutral">pending</Badge>
      </div>
      <form action={action}>
        <input type="hidden" name="invite_id" value={inviteId} />
        <button
          type="submit"
          disabled={pending}
          className="py-2 font-mono text-xs text-text-faint hover:text-magenta"
        >
          {pending ? "…" : "Cancel"}
        </button>
      </form>
    </Card>
  );
}
