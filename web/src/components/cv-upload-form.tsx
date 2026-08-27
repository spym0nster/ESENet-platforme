"use client";

import { useActionState } from "react";
import { uploadCv, type ProfileActionState } from "@/app/actions/student-profile";
import { Button } from "@/components/ui";

export function CvUploadForm({ hasExistingCv }: { hasExistingCv: boolean }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    uploadCv,
    null
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input
        type="file"
        name="cv"
        accept="application/pdf"
        required
        className="text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:font-mono file:text-xs file:text-text-muted"
      />
      <Button type="submit" disabled={pending} variant="secondary" className="px-4 py-2 text-sm">
        {pending ? "Uploading…" : hasExistingCv ? "Replace CV" : "Upload CV"}
      </Button>
      {state && "error" in state && (
        <span className="text-xs text-magenta">{state.error}</span>
      )}
      {state && "success" in state && (
        <span className="text-xs text-accent-2">Uploaded ✓</span>
      )}
    </form>
  );
}
