"use client";

import { useActionState, useState } from "react";
import { applyToOpportunity, type ApplyState } from "@/app/actions/applications";
import { Button, Textarea } from "@/components/ui";

/**
 * The apply CTA sits directly under the facts row, above the description,
 * so it clears the fold without a sticky bar. The cover message is
 * optional and starts hidden behind "Add a note" — the button is the
 * thing, the note is a maybe.
 *
 * `saveButton` is the student's Save control, rendered inline next to
 * Apply so there's one row of actions, not two scattered ones.
 */
export function ApplyForm({
  opportunityId,
  alreadyApplied,
  saveButton,
}: {
  opportunityId: string;
  alreadyApplied: boolean;
  saveButton?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    applyToOpportunity,
    null
  );
  const [noteOpen, setNoteOpen] = useState(false);

  if (alreadyApplied || (state && "success" in state)) {
    return (
      <p
        className="rounded-ctrl px-4 py-3 text-sm font-medium"
        style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
      >
        You&apos;ve applied to this opportunity.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="opportunity_id" value={opportunityId} />

      {noteOpen && (
        <Textarea
          name="message"
          rows={3}
          autoFocus
          placeholder="A short note to the recruiter — why you, in a line or two."
        />
      )}

      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Applying…" : "Apply"}
        </Button>
        {saveButton}
        {!noteOpen && (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="font-mono text-xs uppercase tracking-widest text-text-faint hover:text-text"
          >
            Add a note
          </button>
        )}
      </div>
    </form>
  );
}
