"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui";
import {
  saveEducation,
  type OnboardingStepState,
} from "@/app/actions/onboarding";
import { StepNav } from "@/components/onboarding/step-nav";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 13 }, (_, i) => THIS_YEAR - 6 + i);

export function EducationForm({
  defaults,
  isLast,
  next,
  backHref,
}: {
  defaults: {
    school: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    graduationYear: number | null;
  };
  isLast: boolean;
  next: string | null;
  backHref: string;
}) {
  const [state, action, pending] = useActionState<OnboardingStepState, FormData>(
    saveEducation,
    null
  );

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="University">
        <Input
          name="school"
          defaultValue={
            defaults.school ?? "ESEN — École Supérieure de l'Économie Numérique"
          }
          required
          autoFocus
        />
      </Field>

      <Field label="Graduation year (or expected)">
        <Select
          name="graduation_year"
          defaultValue={defaults.graduationYear?.toString() ?? ""}
          required
        >
          <option value="" disabled>
            Select a year
          </option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Degree">
        <Input
          name="degree"
          defaultValue={defaults.degree ?? ""}
          placeholder="Licence, Mastère, …"
          required
        />
      </Field>

      <Field label="Specialties (optional)">
        <Input
          name="field_of_study"
          defaultValue={defaults.fieldOfStudy ?? ""}
          placeholder="e.g. Business Intelligence, ERP"
        />
      </Field>

      {state?.error && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}

      <StepNav
        backHref={backHref}
        pending={pending}
        submitLabel={isLast ? "Finish" : "Continue"}
        pendingLabel={isLast ? "Finishing…" : "Saving…"}
      />
    </form>
  );
}
