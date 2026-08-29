"use client";

import { useActionState } from "react";
import { uploadProfileMedia, type ProfileMediaState } from "@/app/actions/profile-media";
import { Button } from "@/components/ui";

export function ProfileMediaUpload({
  kind,
  currentUrl,
  label,
}: {
  kind: "avatar" | "banner";
  currentUrl: string | null;
  label: string;
}) {
  const [state, action, pending] = useActionState<ProfileMediaState, FormData>(
    uploadProfileMedia,
    null
  );

  const isAvatar = kind === "avatar";

  return (
    <div>
      <span className="mb-2 block font-mono text-xs uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, next/image would need a remote-pattern config for it
          <img
            src={currentUrl}
            alt=""
            className={
              isAvatar
                ? "h-16 w-16 rounded-full object-cover"
                : "h-16 w-32 rounded-ctrl object-cover"
            }
          />
        ) : (
          <div
            className={
              isAvatar
                ? "h-16 w-16 rounded-full bg-surface-alt"
                : "h-16 w-32 rounded-ctrl bg-surface-alt"
            }
          />
        )}

        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="kind" value={kind} />
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="text-sm text-text-muted file:mr-3 file:rounded-ctrl file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:font-mono file:text-xs file:text-text-muted"
          />
          <Button type="submit" disabled={pending} variant="secondary" size="compact">
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </div>
      {state && "error" in state && (
        <p className="mt-2 text-xs text-magenta">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="mt-2 text-xs text-accent-2">Uploaded.</p>
      )}
    </div>
  );
}
