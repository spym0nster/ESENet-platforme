"use client";

import { useActionState } from "react";
import { updateMyTitle } from "@/app/actions/company-team";
import type { TeamActionState } from "@/app/actions/company-team";
import { Input, Button } from "@/components/ui";

export function MyTitleForm({ currentTitle }: { currentTitle: string | null }) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    updateMyTitle,
    null
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Input
        name="title"
        defaultValue={currentTitle ?? ""}
        placeholder="e.g. HR Manager"
        maxLength={100}
        className="w-56"
      />
      <Button type="submit" variant="secondary" disabled={pending} className="px-4 py-2 text-sm">
        {pending ? "Saving…" : "Save"}
      </Button>
      {state && "error" in state && <span className="text-xs text-magenta">{state.error}</span>}
      {state && "success" in state && <span className="text-xs text-accent-2">Saved ✓</span>}
    </form>
  );
}
