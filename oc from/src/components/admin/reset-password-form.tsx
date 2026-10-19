"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold">New password</label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required className="h-11 bg-bg" autoFocus />
        {state?.fieldErrors?.password && <p className="text-xs text-danger">{state.fieldErrors.password}</p>}
        <p className="text-xs text-dim">At least 12 characters.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm" className="text-sm font-semibold">Confirm new password</label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="h-11 bg-bg" />
        {state?.fieldErrors?.confirm && <p className="text-xs text-danger">{state.fieldErrors.confirm}</p>}
      </div>
      {state?.error && (
        <p role="alert" className="border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <KeyRound />} Set new password
      </Button>
    </form>
  );
}
