"use client";

import { Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold">Email</label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11 bg-bg" autoFocus />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold">Password</label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 bg-bg" />
      </div>
      {state?.error && (
        <p role="alert" className="border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
      </Button>
    </form>
  );
}
