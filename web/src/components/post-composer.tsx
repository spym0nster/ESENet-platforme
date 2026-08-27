"use client";

import { useActionState, useState } from "react";
import { createPost, type PostActionState } from "@/app/actions/posts";
import { Button, Textarea, Input, Select, Card } from "@/components/ui";

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

  return (
    <Card>
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
          placeholder="What are you working on?"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <span className="font-mono uppercase tracking-wide text-text-faint">Image</span>
            <input
              type="file"
              name="media"
              accept="image/jpeg,image/png,image/webp"
              className="text-xs file:mr-2 file:rounded file:border-0 file:bg-surface-alt file:px-2 file:py-1 file:font-mono file:text-[11px]"
            />
          </label>
          <Input name="link_url" type="url" placeholder="Link (optional)" className="w-52 py-1.5 text-xs" />
        </div>

        {companyName && (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono uppercase tracking-wide text-text-faint">Post as</span>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="publish_as"
                value="self"
                checked={publishAs === "self"}
                onChange={() => setPublishAs("self")}
              />
              Myself
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="publish_as"
                value="company"
                checked={publishAs === "company"}
                onChange={() => setPublishAs("company")}
              />
              {companyName}
            </label>
          </div>
        )}

        {ownOpportunities.length > 0 && (
          <label className="block text-xs">
            <span className="mb-1 block font-mono uppercase tracking-wide text-text-faint">
              Link an opportunity (optional)
            </span>
            <Select name="opportunity_id" defaultValue="" className="py-1.5 text-xs">
              <option value="">None</option>
              {ownOpportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </Select>
          </label>
        )}

        {ownProjects.length > 0 && (
          <label className="block text-xs">
            <span className="mb-1 block font-mono uppercase tracking-wide text-text-faint">
              Link a project (optional)
            </span>
            <Select name="project_id" defaultValue="" className="py-1.5 text-xs">
              <option value="">None</option>
              {ownProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </label>
        )}

        {state && "error" in state && <p className="text-xs text-magenta">{state.error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="px-4 py-2 text-xs">
            {pending ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
