"use client";

import { CheckCircle2, Loader2, SendHorizonal } from "lucide-react";
import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(requestPasswordReset, undefined);

  if (state?.message) {
    return (
      <div className="flex items-start gap-3 border border-line bg-surface p-4 text-sm">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-azure" />
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold">Email</label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11 bg-bg" autoFocus />
      </div>
      {state?.error && (
        <p role="alert" className="border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <SendHorizonal />} Send reset link
      </Button>
    </form>
  );
}
