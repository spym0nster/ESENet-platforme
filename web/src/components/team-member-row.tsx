"use client";

import { useActionState } from "react";
import {
  removeTeamMember,
  cancelInvite,
  type TeamActionState,
} from "@/app/actions/company-team";
import { Card, Badge } from "@/components/ui";

export function TeamMemberRow({
  name,
  role,
  canRemove,
  memberId,
}: {
  name: string;
  role: "owner" | "member";
  canRemove: boolean;
  memberId: string;
}) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    removeTeamMember,
    null
  );

  if (state && "success" in state) return null;

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{name}</p>
        <Badge variant={role === "owner" ? "info" : "neutral"}>{role}</Badge>
      </div>
      {canRemove && (
        <form action={action}>
          <input type="hidden" name="member_id" value={memberId} />
          <button
            type="submit"
            disabled={pending}
            className="py-2 font-mono text-xs text-text-faint hover:text-magenta"
          >
            {pending ? "…" : "Remove"}
          </button>
        </form>
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
