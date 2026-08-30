"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { saveCv, skipCv, type OnboardingStepState } from "@/app/actions/onboarding";
import { StepNav } from "@/components/onboarding/step-nav";

export function CvForm({
  next,
  backHref,
}: {
  next: string | null;
  backHref: string;
}) {
  const [state, action, pending] = useActionState<OnboardingStepState, FormData>(
    saveCv,
    null
  );
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="mt-8">
      <form action={action}>
        <input type="hidden" name="next" value={next ?? ""} />

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed border-border-strong px-6 py-10 text-center transition hover:border-accent-2/60">
          <span className="font-display font-semibold text-text">
            {fileName ?? "Choose a PDF or drop it here"}
          </span>
          <span className="font-mono text-xs text-text-faint">
            PDF only · up to 5 MB
          </span>
          <input
            type="file"
            name="cv"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        {state?.error && (
          <p className="mt-3 text-sm text-magenta">{state.error}</p>
        )}

        <StepNav
          backHref={backHref}
          pending={pending}
          submitLabel="Finish"
          pendingLabel="Finishing…"
        />
      </form>

      <form action={skipCv} className="mt-3 text-center">
        <input type="hidden" name="next" value={next ?? ""} />
        <Button type="submit" variant="ghost" size="compact">
          Skip for now
        </Button>
      </form>
    </div>
  );
}
