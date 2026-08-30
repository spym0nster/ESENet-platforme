import Link from "next/link";
import { Button } from "@/components/ui";

/**
 * The footer of every onboarding step: Back (a real `<a href>` to the
 * previous step, so the browser back button and this do the same thing —
 * omitted on step 1) and Continue (submits the step form). Non-sticky, in
 * the flow.
 */
export function StepNav({
  backHref,
  pending,
  submitLabel = "Continue",
  pendingLabel = "Saving…",
}: {
  backHref?: string;
  pending: boolean;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center font-mono text-xs text-text-muted transition hover:text-text"
        >
          ← Back
        </Link>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
