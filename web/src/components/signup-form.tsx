"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";
import { Field, Input, Button } from "@/components/ui";

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

      <Field label="Your full name">
        <Input name="full_name" type="text" required />
      </Field>
      {role === "company" && (
        <p className="text-xs text-text-faint">
          You&rsquo;ll create or join a company right after signing in.
        </p>
      )}
      <Field label="Email">
        <Input name="email" type="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required />
      </Field>

      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      {state && "info" in state && (
        <p
          className="rounded-md px-4 py-3 text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
        >
          {state.info}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
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
