"use client";

import { useActionState } from "react";
import { leaveCompany, type TeamActionState } from "@/app/actions/company-team";
import { Button } from "@/components/ui";

export function LeaveCompanyButton({ companyName }: { companyName: string }) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    leaveCompany,
    null
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Leave ${companyName}? You'll keep your ESENet account and can join or create a different company afterward.`)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Leaving…" : `Leave ${companyName}`}
      </Button>
      {state && "error" in state && (
        <p className="mt-2 text-sm text-magenta">{state.error}</p>
      )}
    </form>
  );
}
