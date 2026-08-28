"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";
import { Field, Input, Button } from "@/components/ui";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    null
  );

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-accent-2 hover:text-text">
          Forgot password?
        </Link>
      </div>
      {notice && !(state && "error" in state) && (
        <p className="text-sm text-magenta">{notice}</p>
      )}
      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
