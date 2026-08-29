"use client";

import { useActionState, useRef, useState } from "react";
import { createPost, type PostActionState } from "@/app/actions/posts";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

export function PostComposer({
  companyName,
  ownProjects,
  ownOpportunities,
}: {
  /** Non-null when the current user can act for a company (owner or member). */
  companyName: string | null;
  ownProjects: { id: string; title: string }[];
  ownOpportunities: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState<PostActionState, FormData>(createPost, null);
  const [publishAs, setPublishAs] = useState<"self" | "company">("self");
  const [attachOpen, setAttachOpen] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="p-4">
      <form
        action={action}
        key={state && "success" in state ? "reset" : "form"}
        className="space-y-3"
      >
        <Textarea
          name="body"
          required
          maxLength={3000}
          rows={3}
          placeholder="Share something with the ESEN community"
        />

        {/* hidden — driven by the buttons below */}
        <input
          ref={fileRef}
          type="file"
          name="media"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
        />
        <input type="hidden" name="publish_as" value={publishAs} />

        {attachOpen && (
          <div className="space-y-3 rounded-ctrl border border-border bg-bg-2 p-3">
            <Input name="link_url" type="url" placeholder="Link (https://…)" />
            {ownOpportunities.length > 0 && (
              <Select name="opportunity_id" defaultValue="" aria-label="Link an opportunity">
                <option value="">Link an opportunity…</option>
                {ownOpportunities.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </Select>
            )}
            {ownProjects.length > 0 && (
              <Select name="project_id" defaultValue="" aria-label="Link a project">
                <option value="">Link a project…</option>
                {ownProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Select>
            )}
          </div>
        )}

        {state && "error" in state && (
          <p className="text-sm text-magenta">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => fileRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m5 19 5-5 4 4 3-3 4 4" />
            </svg>
            {imageName ? "Image added" : "Add image"}
          </Button>
          {imageName && (
            <button
              type="button"
              onClick={() => {
                setImageName(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="font-mono text-[11px] uppercase tracking-widest text-text-faint hover:text-magenta"
            >
              Remove
            </button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setAttachOpen((v) => !v)}
          >
            {attachOpen ? "Hide attachments" : "Add a link"}
          </Button>

          {companyName && (
            <span className="ml-auto inline-flex overflow-hidden rounded-ctrl border border-border-strong text-xs">
              {(["self", "company"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPublishAs(v)}
                  className={`min-h-9 px-3 font-medium transition ${
                    publishAs === v
                      ? "bg-accent/15 text-text"
                      : "text-text-faint hover:text-text"
                  }`}
                >
                  {v === "self" ? "As me" : companyName}
                </button>
              ))}
            </span>
          )}

          <Button
            type="submit"
            disabled={pending}
            className={companyName ? "" : "ml-auto"}
          >
            {pending ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
