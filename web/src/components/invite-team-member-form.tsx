"use client";

import { useActionState } from "react";
import { inviteTeamMember, type TeamActionState } from "@/app/actions/company-team";
import { Input, Button } from "@/components/ui";

export function InviteTeamMemberForm() {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    inviteTeamMember,
    null
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex-1">
        <label className="mb-1 block font-mono text-xs uppercase tracking-wide text-text-faint">
          Invite by email
        </label>
        <Input name="email" type="email" required placeholder="colleague@company.com" />
      </div>
      <Button type="submit" disabled={pending} className="px-4 py-2.5">
        {pending ? "Sending…" : "Send invite"}
      </Button>
      {state && "error" in state && (
        <p className="w-full text-sm text-magenta">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-accent-2">Invite sent.</p>
      )}
    </form>
  );
}
