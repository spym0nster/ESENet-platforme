"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Field, Input } from "@/components/ui";
import { saveGoals, type OnboardingStepState } from "@/app/actions/onboarding";
import { GOAL_TYPES, MAX_GOAL_TYPES } from "@/lib/onboarding";
import { StepNav } from "@/components/onboarding/step-nav";

export function GoalsForm({
  defaultGoals,
  defaultInterests,
  next,
}: {
  defaultGoals: string[];
  defaultInterests: string | null;
  next: string | null;
}) {
  const [state, action, pending] = useActionState<OnboardingStepState, FormData>(
    saveGoals,
    null
  );
  const [goals, setGoals] = useState<string[]>(defaultGoals);
  const firstCardRef = useRef<HTMLButtonElement>(null);

  // §3: focus the first control of the step — here that's the first card.
  useEffect(() => {
    firstCardRef.current?.focus();
  }, []);

  function toggle(value: string) {
    setGoals((g) =>
      g.includes(value)
        ? g.filter((x) => x !== value)
        : g.length < MAX_GOAL_TYPES
          ? [...g, value]
          : g
    );
  }

  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="goal_types" value={JSON.stringify(goals)} />

      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_TYPES.map((g, i) => {
          const on = goals.includes(g.value);
          return (
            <button
              key={g.value}
              ref={i === 0 ? firstCardRef : undefined}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g.value)}
              className={`flex items-center justify-between rounded-ctrl border p-4 text-left font-display font-semibold transition ${
                on
                  ? "border-accent bg-accent/5 text-text"
                  : "border-border-strong text-text-muted hover:border-accent-2/60 hover:text-text"
              }`}
            >
              {g.label}
              {on && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="m3 8.5 3.5 3.5L13 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-xs text-text-faint">
        {goals.length} / {MAX_GOAL_TYPES} selected
      </p>

      <div className="mt-6">
        <Field label="Anything specific you're interested in? (optional)">
          <Input
            name="interests"
            defaultValue={defaultInterests ?? ""}
            placeholder="e.g. data engineering, product design"
          />
        </Field>
      </div>

      {state?.error && (
        <p className="mt-3 text-sm text-magenta">{state.error}</p>
      )}

      <StepNav pending={pending} />
    </form>
  );
}
