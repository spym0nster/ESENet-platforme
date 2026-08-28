"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";
import { Field, Input, Button } from "@/components/ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    null
  );

  if (state && "info" in state) {
    return <p className="text-sm text-text">{state.info}</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
