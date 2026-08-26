"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    null
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      {state?.error && <p className="text-sm text-magenta">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-xs uppercase tracking-wide text-text-faint">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-border bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
      />
    </label>
  );
}
