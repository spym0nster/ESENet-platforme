"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { Field, Input, Button } from "@/components/ui";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    null
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="New password">
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirm new password">
        <Input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
