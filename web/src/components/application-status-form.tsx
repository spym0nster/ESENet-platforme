"use client";

import { useActionState } from "react";
import {
  updateApplicationStatus,
  type StatusUpdateState,
} from "@/app/actions/applications";
import { Select, Button, Textarea } from "@/components/ui";
import type { ApplicationStatus } from "@/types/database";

const COMPANY_STATUS_LABEL: Record<string, string> = {
  applied: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};

const COMPANY_STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
];

export function ApplicationStatusForm({
  applicationId,
  opportunityId,
  currentStatus,
}: {
  applicationId: string;
  opportunityId: string;
  currentStatus: ApplicationStatus;
}) {
  const [state, action, pending] = useActionState<StatusUpdateState, FormData>(
    updateApplicationStatus,
    null
  );

  if (currentStatus === "withdrawn") {
    return <span className="font-mono text-xs text-text-faint">Withdrawn by student</span>;
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <div className="flex items-center gap-2">
        <Select name="status" defaultValue={currentStatus} className="w-auto py-1.5 text-xs">
          {COMPANY_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {COMPANY_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={pending} className="px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
      <Textarea
        name="note"
        rows={2}
        maxLength={1000}
        placeholder="Optional note to the student (sent with the status change)…"
        className="w-64 text-xs"
      />
      {state && "error" in state && (
        <span className="text-xs text-magenta">{state.error}</span>
      )}
      {state && "success" in state && (
        <span className="text-xs text-text-faint">Saved</span>
      )}
    </form>
  );
}
