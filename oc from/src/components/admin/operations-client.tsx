"use client";

import { Check, Loader2, Pin, PinOff, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addOperationsNote, updateOperationsNote } from "@/actions/operations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { OperationalDay } from "@/generated/prisma/enums";
import { useAction } from "@/hooks/use-action";

/** Re-fetches server data every `seconds` while the tab is visible, so the ops screen stays live. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [last, setLast] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        start(() => router.refresh());
        setLast(new Date());
      }
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return (
    <button
      type="button"
      onClick={() => {
        start(() => router.refresh());
        setLast(new Date());
      }}
      className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim hover:text-text"
      aria-label="Refresh now"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      <span suppressHydrationWarning>Live · updated {last.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
    </button>
  );
}

export function NoteComposer({ day }: { day: OperationalDay | null }) {
  const { run, pending } = useAction();
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => addOperationsNote({ body, day, pinned }));
        if (r.ok) {
          setBody("");
          setPinned(false);
        }
      }}
    >
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={1000} placeholder="Add an important note for the team…" className="bg-bg text-base" aria-label="New note" />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <Checkbox checked={pinned} onCheckedChange={(c) => setPinned(c === true)} /> Pin to top
        </label>
        <Button size="sm" type="submit" disabled={pending || body.trim().length < 2}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add note
        </Button>
      </div>
    </form>
  );
}

export function NoteActions({ id, pinned, resolved }: { id: string; pinned: boolean; resolved: boolean }) {
  const { run, pending } = useAction();
  return (
    <div className="flex shrink-0 gap-1">
      {!resolved && (
        <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => void run(() => updateOperationsNote(id, { pinned: !pinned }))} aria-label={pinned ? "Unpin" : "Pin"}>
          {pinned ? <PinOff /> : <Pin />}
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => void run(() => updateOperationsNote(id, { resolved: !resolved }))} aria-label={resolved ? "Reopen" : "Mark resolved"}>
        {resolved ? <RotateCcw /> : <Check />}
      </Button>
    </div>
  );
}
