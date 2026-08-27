"use client";

import { useActionState } from "react";
import { resolveReport, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui";

export function ResolveReportButtons({ reportId }: { reportId: string }) {
  const [resolveState, resolveAction, resolvePending] = useActionState<AdminActionState, FormData>(
    resolveReport,
    null
  );
  const [dismissState, dismissAction, dismissPending] = useActionState<AdminActionState, FormData>(
    resolveReport,
    null
  );

  if (("success" in (resolveState ?? {})) || ("success" in (dismissState ?? {}))) {
    return <span className="font-mono text-xs text-text-faint">Updated</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <form action={resolveAction}>
        <input type="hidden" name="report_id" value={reportId} />
        <input type="hidden" name="status" value="resolved" />
        <Button type="submit" variant="secondary" disabled={resolvePending} className="px-3 py-1 text-xs">
          Mark resolved
        </Button>
      </form>
      <form action={dismissAction}>
        <input type="hidden" name="report_id" value={reportId} />
        <input type="hidden" name="status" value="dismissed" />
        <Button type="submit" variant="ghost" disabled={dismissPending} className="px-3 py-1 text-xs">
          Dismiss
        </Button>
      </form>
    </div>
  );
}
