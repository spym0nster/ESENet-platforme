"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    null
  );
  const [role, setRole] = useState<"student" | "company">("student");

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <RoleButton
          label="I'm a student"
          active={role === "student"}
          onClick={() => setRole("student")}
        />
        <RoleButton
          label="I'm a company"
          active={role === "company"}
          onClick={() => setRole("company")}
        />
      </div>
      <input type="hidden" name="role" value={role} />

      <Field
        label={role === "student" ? "Full name" : "Company name"}
        name="full_name"
        type="text"
        required
      />
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />

      {state?.error && <p className="text-sm text-magenta">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function RoleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-accent-2 bg-accent2-soft text-accent-2"
          : "border-border text-text-muted"
      }`}
    >
      {label}
    </button>
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
