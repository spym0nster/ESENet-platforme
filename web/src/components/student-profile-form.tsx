"use client";

import { useActionState, useState } from "react";
import {
  updateStudentProfile,
  type ProfileActionState,
} from "@/app/actions/student-profile";
import { Field, Input, Textarea, Button } from "@/components/ui";
import type { StudentDetails } from "@/types/database";

export function StudentProfileForm({ details }: { details: StudentDetails }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    updateStudentProfile,
    null
  );
  const [skills, setSkills] = useState<string[]>(details.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");

  function addSkill() {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) {
      setSkills([...skills, value]);
    }
    setSkillDraft("");
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="skills" value={JSON.stringify(skills)} />

      <Field label="Headline">
        <Input
          name="headline"
          defaultValue={details.headline ?? ""}
          placeholder="e.g. Business Intelligence student at ESEN"
        />
      </Field>

      <Field label="Bio">
        <Textarea name="bio" defaultValue={details.bio ?? ""} rows={4} />
      </Field>

      <Field label="Skills">
        <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface p-2.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 rounded bg-accent2-soft px-2 py-1 font-mono text-xs text-accent-2"
            >
              {skill}
              <button
                type="button"
                onClick={() => setSkills(skills.filter((s) => s !== skill))}
                aria-label={`Remove ${skill}`}
                className="text-accent-2/70 hover:text-accent-2"
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
            placeholder={skills.length === 0 ? "SQL, Power BI… (press Enter)" : "Add another…"}
            className="min-w-[10rem] flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </Field>

      <Field label="Looking for">
        <Input
          name="looking_for"
          defaultValue={details.looking_for ?? ""}
          placeholder="e.g. PFE, internship, part-time"
        />
      </Field>

      <Field label="Available from">
        <Input name="availability" type="date" defaultValue={details.availability ?? ""} />
      </Field>

      <Field label="LinkedIn">
        <Input
          name="linkedin_url"
          type="url"
          defaultValue={details.linkedin_url ?? ""}
          placeholder="https://linkedin.com/in/…"
        />
      </Field>

      {state && "error" in state && (
        <p className="text-sm text-magenta">{state.error}</p>
      )}
      {state && "success" in state && (
        <p
          className="rounded-md px-4 py-3 text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
        >
          Profile saved.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
