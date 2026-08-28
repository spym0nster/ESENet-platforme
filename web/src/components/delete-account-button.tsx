"use client";

import { useActionState } from "react";
import { deleteMyAccount, type AccountActionState } from "@/app/actions/account";
import { Button } from "@/components/ui";

export function DeleteAccountButton() {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(
    deleteMyAccount,
    null
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete your ESENet account? Your CV, education, experience, projects, and certifications will be permanently removed, and you'll be signed out immediately. This can't be undone."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        className="border-magenta text-magenta hover:bg-magenta-soft"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </Button>
      {state && "error" in state && (
        <p className="mt-2 text-sm text-magenta">{state.error}</p>
      )}
    </form>
  );
}
