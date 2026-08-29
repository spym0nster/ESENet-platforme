"use client";

import { useActionState, useState } from "react";
import {
  createOpportunity,
  updateOpportunity,
  type OpportunityState,
} from "@/app/actions/opportunities";
import { Button, LinkButton } from "@/components/ui";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "internship", label: "Internship" },
  { value: "pfe", label: "PFE" },
  { value: "job", label: "Job" },
  { value: "alternance", label: "Alternance" },
  { value: "freelance", label: "Freelance" },
];

export type OpportunityFormValues = {
  id: string;
  type: string;
  title: string;
  description: string;
  skills: string[];
  location: string | null;
  remote: boolean;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
};

export function OpportunityForm({
  opportunity,
}: {
  opportunity?: OpportunityFormValues;
}) {
  const isEdit = Boolean(opportunity);
  const [state, action, pending] = useActionState<OpportunityState, FormData>(
    isEdit ? updateOpportunity.bind(null, opportunity!.id) : createOpportunity,
    null
  );
  const [skills, setSkills] = useState<string[]>(opportunity?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const fieldErrors = state && "fieldErrors" in state ? state.fieldErrors : undefined;

  function addSkill() {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) {
      setSkills([...skills, value]);
    }
    setSkillDraft("");
  }

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="skills" value={JSON.stringify(skills)} />

      <Section title="Basic information">
        <Field label="Opportunity type" error={fieldErrors?.type}>
          <select
            name="type"
            required
            defaultValue={opportunity?.type ?? ""}
            className="w-full rounded-ctrl border border-border-strong bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
          >
            <option value="" disabled>
              Select a type
            </option>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" error={fieldErrors?.title}>
          <input
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={120}
            defaultValue={opportunity?.title ?? ""}
            placeholder="Business Intelligence PFE Intern"
            className="w-full rounded-ctrl border border-border-strong bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
          />
        </Field>

        <Field label="Description" error={fieldErrors?.description}>
          <textarea
            name="description"
            required
            rows={6}
            defaultValue={opportunity?.description ?? ""}
            placeholder="We are looking for a Business Intelligence student to join our data team for a PFE project..."
            className="w-full rounded-ctrl border border-border-strong bg-surface p-3 text-sm outline-none focus:border-accent-2"
          />
        </Field>
      </Section>

      <Section title="Requirements">
        <Field label="Skills">
          <div className="flex flex-wrap gap-2 rounded-ctrl border border-border-strong bg-surface p-2.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-chip bg-accent2-soft px-2 py-1 font-mono text-xs text-accent-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((s) => s !== skill))}
                  aria-label={`Remove ${skill}`}
                  className="-m-1 p-1 text-accent-2/70 hover:text-accent-2"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              onBlur={addSkill}
              placeholder={skills.length === 0 ? "SQL, Power BI, Python… (press Enter)" : "Add another…"}
              className="min-w-[10rem] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </Field>
      </Section>

      <Section title="Details">
        <Field label="Location">
          <input
            name="location"
            type="text"
            defaultValue={opportunity?.location ?? ""}
            placeholder="Tunis, Sousse, Hybrid…"
            className="w-full rounded-ctrl border border-border-strong bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            name="remote"
            defaultChecked={opportunity?.remote ?? false}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          This opportunity can be done remotely
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <input
              name="start_date"
              type="date"
              defaultValue={opportunity?.start_date ?? ""}
              className="w-full rounded-ctrl border border-border-strong bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
            />
          </Field>
          <Field label="End date" error={fieldErrors?.end_date}>
            <input
              name="end_date"
              type="date"
              defaultValue={opportunity?.end_date ?? ""}
              className="w-full rounded-ctrl border border-border-strong bg-surface p-2.5 text-sm outline-none focus:border-accent-2"
            />
          </Field>
        </div>

        <Field
          label="Application deadline"
          error={fieldErrors?.application_deadline}
        >
          <input
            name="application_deadline"
            type="date"
            defaultValue={opportunity?.application_deadline ?? ""}
            className="w-full rounded-ctrl border border-border-strong bg-surface p-2.5 text-sm outline-none focus:border-accent-2 sm:w-1/2"
          />
          <span className="mt-1 block text-xs text-text-faint">
            After this date students can no longer apply. Leave blank for no
            deadline.
          </span>
        </Field>
      </Section>

      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? "Saving…"
              : "Publishing…"
            : isEdit
              ? "Save changes"
              : "Publish opportunity"}
        </Button>
        <LinkButton href="/company/dashboard" variant="ghost">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 font-mono text-xs uppercase tracking-widest text-accent-2">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-xs uppercase tracking-wide text-text-faint">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-magenta">{error}</span>}
    </label>
  );
}
