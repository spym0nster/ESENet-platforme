"use client";

import { useActionState, useState } from "react";
import { createReport, type ReportActionState } from "@/app/actions/reports";
import { Button, Select } from "@/components/ui";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake_information", label: "Fake information" },
  { value: "recruitment_abuse", label: "Recruitment abuse" },
  { value: "other", label: "Other" },
];

export function ReportButton({
  postId,
  commentId,
}: {
  postId?: string;
  commentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReportActionState, FormData>(
    createReport,
    null
  );

  if (state && "success" in state) {
    return <span className="font-mono text-xs text-text-faint">Reported</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-xs uppercase tracking-wide text-text-faint hover:text-magenta"
      >
        Report
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      {postId && <input type="hidden" name="post_id" value={postId} />}
      {commentId && <input type="hidden" name="comment_id" value={commentId} />}
      <Select name="reason" required defaultValue="" className="w-auto py-1 text-xs">
        <option value="" disabled>
          Reason…
        </option>
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" disabled={pending} className="px-3 py-1 text-xs">
        Submit
      </Button>
      {state && "error" in state && <span className="text-xs text-magenta">{state.error}</span>}
    </form>
  );
}
