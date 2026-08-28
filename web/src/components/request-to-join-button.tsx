"use client";

import { useActionState, useState } from "react";
import { requestToJoinCompany, type OnboardingState } from "@/app/actions/company-onboarding";
import { Button, Input } from "@/components/ui";

export function RequestToJoinButton({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    requestToJoinCompany,
    null
  );

  if (state && "success" in state) {
    return <span className="font-mono text-xs text-accent-2">Request sent</span>;
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="px-3 py-1.5 text-xs">
        Request to join
      </Button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="company_id" value={companyId} />
      <Input
        name="message"
        type="text"
        placeholder={`e.g. "I'm the HR manager at ${companyName}"`}
        className="text-xs"
        maxLength={500}
      />
      <Button type="submit" disabled={pending} className="shrink-0 px-3 py-1.5 text-xs">
        {pending ? "Sending…" : "Send request"}
      </Button>
      {state && "error" in state && (
        <p className="text-xs text-magenta sm:basis-full">{state.error}</p>
      )}
    </form>
  );
}
