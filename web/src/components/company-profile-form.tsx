"use client";

import { useActionState } from "react";
import {
  updateCompanyProfile,
  type CompanyProfileState,
} from "@/app/actions/company-profile";
import { Field, Input, Textarea, Button } from "@/components/ui";
import type { Company } from "@/types/database";

export function CompanyProfileForm({ company }: { company: Company }) {
  const [state, action, pending] = useActionState<CompanyProfileState, FormData>(
    updateCompanyProfile,
    null
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Company name">
        <Input name="company_name" defaultValue={company.company_name} required minLength={2} />
      </Field>
      <Field label="Website">
        <Input
          name="website"
          type="url"
          defaultValue={company.website ?? ""}
          placeholder="https://…"
        />
      </Field>
      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={company.description ?? ""}
          rows={5}
          placeholder="What does your company do? What kind of talent are you looking for?"
        />
      </Field>

      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="rounded-ctrl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-on-soft">
          Profile saved.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
