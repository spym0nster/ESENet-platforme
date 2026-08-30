"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui";
import { saveSkills, type OnboardingStepState } from "@/app/actions/onboarding";
import { StepNav } from "@/components/onboarding/step-nav";

export function SkillsForm({
  suggestions,
  defaultSkills,
  next,
  backHref,
}: {
  suggestions: string[];
  defaultSkills: string[];
  next: string | null;
  backHref: string;
}) {
  const [state, action, pending] = useActionState<OnboardingStepState, FormData>(
    saveSkills,
    null
  );
  const [skills, setSkills] = useState<string[]>(defaultSkills);
  const [draft, setDraft] = useState("");

  const has = (v: string) =>
    skills.some((s) => s.toLowerCase() === v.toLowerCase());

  function add(value: string) {
    const v = value.trim();
    if (v && !has(v)) setSkills((s) => [...s, v]);
    setDraft("");
  }
  function remove(value: string) {
    setSkills((s) => s.filter((x) => x !== value));
  }

  const unpicked = suggestions.filter((s) => !has(s));
  const shortBy = Math.max(0, 3 - skills.length);

  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="skills" value={JSON.stringify(skills)} />

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => remove(s)}
              aria-label={`Remove ${s}`}
              className="inline-flex items-center gap-1 rounded-chip border border-accent-2/30 bg-accent2-soft px-2 py-0.5 font-mono text-[11px] text-accent-2 transition hover:brightness-110"
            >
              {s}
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M2 2l6 6M8 2l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Type a skill and press Enter"
          aria-label="Add a skill"
          autoFocus
        />
      </div>

      {unpicked.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Suggested — what companies are asking for
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unpicked.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="inline-flex items-center gap-1 rounded-chip border border-border bg-text/6 px-2 py-0.5 font-mono text-[11px] text-text-muted transition hover:text-text"
              >
                <span aria-hidden>+</span>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-text-muted">
        Add at least 3 — we use them to match you to opportunities and to show
        your skill overlap on each one.
      </p>
      {skills.length > 0 && shortBy > 0 && (
        <p className="mt-1 font-mono text-xs text-text-faint">
          {shortBy} more recommended
        </p>
      )}

      {state?.error && (
        <p className="mt-3 text-sm text-magenta">{state.error}</p>
      )}

      <StepNav backHref={backHref} pending={pending} />
    </form>
  );
}
