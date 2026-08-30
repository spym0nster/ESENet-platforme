"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Field, Input, Textarea } from "@/components/ui";
import {
  updateCompanyProfile,
  type CompanyProfileState,
} from "@/app/actions/company-profile";

/**
 * The company Details step. Reuses `updateCompanyProfile` (the same write as
 * /company/profile) and redirects to the Logo step on success. The company
 * name is resubmitted from a hidden field so the action's "name required"
 * check passes without asking for it again.
 */
export function CompanyDetailsForm({
  companyName,
  website,
  description,
  nextHref,
}: {
  companyName: string;
  website: string | null;
  description: string | null;
  nextHref: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CompanyProfileState, FormData>(
    updateCompanyProfile,
    null
  );

  useEffect(() => {
    if (state && "success" in state) router.push(nextHref);
  }, [state, nextHref, router]);

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="company_name" value={companyName} />

      <Field label="Website (optional)">
        <Input
          name="website"
          type="url"
          defaultValue={website ?? ""}
          placeholder="https://…"
          autoFocus
        />
      </Field>

      <Field label="What does your company do? (optional)">
        <Textarea
          name="description"
          rows={4}
          defaultValue={description ?? ""}
          placeholder="A sentence or two — it shows on your public page."
        />
      </Field>

      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Link
          href={nextHref}
          className="inline-flex min-h-11 items-center font-mono text-xs text-text-muted transition hover:text-text"
        >
          Skip
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
