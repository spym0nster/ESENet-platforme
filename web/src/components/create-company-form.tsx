"use client";

import { useActionState } from "react";
import { createCompany, type OnboardingState } from "@/app/actions/company-onboarding";
import { Field, Input, Button } from "@/components/ui";

export function CreateCompanyForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    createCompany,
    null
  );

  return (
    <form action={action} className="space-y-3">
      <Field label="Company name">
        <Input name="company_name" type="text" required placeholder="ABC Digital" />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create company"}
      </Button>
      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
    </form>
  );
}
