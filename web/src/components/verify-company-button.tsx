"use client";

import { useActionState } from "react";
import { verifyCompany, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui";

export function VerifyCompanyButton({ companyProfileId }: { companyProfileId: string }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    verifyCompany,
    null
  );

  if (state && "success" in state) {
    return <span className="font-mono text-xs text-accent-2">Verified ✓</span>;
  }

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="company_profile_id" value={companyProfileId} />
      <Button type="submit" disabled={pending} variant="primary" className="px-4 py-2">
        {pending ? "Verifying…" : "Approve"}
      </Button>
      {state && "error" in state && (
        <span className="text-xs text-magenta">{state.error}</span>
      )}
    </form>
  );
}
