"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui";
import {
  saveIdentity,
  type OnboardingStepState,
} from "@/app/actions/onboarding";
import { StepNav } from "@/components/onboarding/step-nav";

export function IdentityForm({
  defaultName,
  defaultHeadline,
  next,
  backHref,
}: {
  defaultName: string;
  defaultHeadline: string | null;
  next: string | null;
  backHref: string;
}) {
  const [state, action, pending] = useActionState<OnboardingStepState, FormData>(
    saveIdentity,
    null
  );

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Your name">
        <Input name="full_name" defaultValue={defaultName} required autoFocus />
      </Field>

      <Field label="Headline">
        <Input
          name="headline"
          defaultValue={defaultHeadline ?? ""}
          placeholder="e.g. Business Intelligence student at ESEN"
          required
        />
      </Field>
      <p className="text-xs text-text-muted">
        Shown under your name everywhere on ESENet.
      </p>

      {state?.error && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}

      <StepNav backHref={backHref} pending={pending} />
    </form>
  );
}
