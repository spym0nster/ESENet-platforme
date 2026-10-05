"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, FileText, Loader2, Pencil, ShieldCheck, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { submitApplication } from "@/actions/application";
import { describedBy, Field, SectionHeading } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CV_MAX_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  applicationSchema,
  CLASS_YEARS,
  EMPTY_APPLICATION,
  STEP_FIELDS,
  type ApplicationData,
  type ApplicationInput,
} from "@/lib/validation/application";

type SkillOption = { id: string; name: string; isOther: boolean };

const STEPS = [
  { key: "profile", n: "01", label: "Profile" },
  { key: "skills", n: "02", label: "Skills" },
  { key: "experience", n: "03", label: "Experience" },
  { key: "commitment", n: "04", label: "Commitment" },
  { key: "review", n: "05", label: "Review" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];
const DRAFT_KEY = "esenet-oc-application-draft-v1";

const inputClass = "h-11 bg-surface text-base sm:text-sm";

function stepOf(field: string): number {
  const idx = (Object.keys(STEP_FIELDS) as (keyof typeof STEP_FIELDS)[]).findIndex((k) =>
    (STEP_FIELDS[k] as readonly string[]).includes(field),
  );
  return idx === -1 ? 0 : idx;
}

export function ApplicationForm({ skills, cvEnabled }: { skills: SkillOption[]; cvEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const form = useForm<ApplicationInput, unknown, ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: EMPTY_APPLICATION,
    mode: "onTouched",
  });
  const { register, control, formState, trigger, setError, handleSubmit, getValues } = form;
  const errors = formState.errors;

  const [eventExp, ambExp, skillIds] = useWatch({ control, name: ["eventExperience", "ambassadorExperience", "skillIds"] });
  const otherSkill = skills.find((s) => s.isOther);
  const otherTicked = Boolean(otherSkill && skillIds?.includes(otherSkill.id));

  // Restore an unfinished draft (this tab only). Files can't be restored — that's expected.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) form.reset({ ...EMPTY_APPLICATION, ...JSON.parse(raw), website: "" });
    } catch {
      /* storage unavailable — start fresh */
    }
  }, [form]);

  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        try {
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
        } catch {
          /* ignore */
        }
      },
    });
  }, [form]);

  function goTo(i: number) {
    setStep(i);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function next() {
    const key = STEPS[step].key;
    if (key !== "review") {
      const fields = [...STEP_FIELDS[key as Exclude<StepKey, "review">]] as FieldPath<ApplicationInput>[];
      const ok = await trigger(fields, { shouldFocus: true });
      if (key === "skills" && otherTicked && !getValues("otherSkill").trim()) {
        setError("otherSkill", { message: "Tell us which other skill." }, { shouldFocus: true });
        return;
      }
      if (!ok) return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  function onCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setCvError(undefined);
    if (!f) return setCvFile(null);
    if (f.type !== "application/pdf" || !/\.pdf$/i.test(f.name)) {
      e.target.value = "";
      return setCvError("Upload your CV as a PDF file.");
    }
    if (f.size > CV_MAX_BYTES) {
      e.target.value = "";
      return setCvError("Your CV must be 3 MB or smaller.");
    }
    setCvFile(f);
  }

  const onValid = (values: ApplicationData) => {
    setServerError(undefined);
    const fd = new FormData();
    fd.append("payload", JSON.stringify({ ...values, otherSkill: otherTicked ? values.otherSkill : "" }));
    if (cvFile) fd.append("cv", cvFile);
    startTransition(async () => {
      const res = await submitApplication(fd);
      if (res.ok) {
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.push("/application/success");
        return;
      }
      setServerError(res.error);
      if (res.fieldErrors) {
        let first = Infinity;
        for (const [k, msg] of Object.entries(res.fieldErrors)) {
          if (k === "cv") {
            setCvError(msg);
            first = Math.min(first, stepOf("whatCanYouBring"));
            continue;
          }
          setError(k as FieldPath<ApplicationInput>, { message: msg });
          first = Math.min(first, stepOf(k));
        }
        if (Number.isFinite(first)) goTo(first);
      }
    });
  };

  const onInvalid = (errs: Partial<Record<string, unknown>>) => {
    const first = Math.min(...Object.keys(errs).map(stepOf));
    goTo(Number.isFinite(first) ? first : 0);
  };

  const current = STEPS[step].key;
  const values = getValues();
  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? "—";

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Step indicator */}
      <nav aria-label="Application steps" className="mb-10">
        <ol className="grid grid-cols-5 gap-1.5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => i < step && goTo(i)}
                  disabled={i >= step}
                  aria-current={active ? "step" : undefined}
                  className="group w-full text-left disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "block h-0.5 w-full transition-colors",
                      done ? "bg-azure" : active ? "bg-gradient-brand" : "bg-line-strong",
                    )}
                  />
                  <span className={cn("mt-3 block font-mono text-[11px] tracking-[0.14em]", active ? "text-text" : done ? "text-azure" : "text-dim")}>
                    {s.n}
                    <span className="hidden sm:inline"> {s.label.toUpperCase()}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-muted sm:hidden">
          Step {step + 1} of {STEPS.length} — <span className="text-text">{STEPS[step].label}</span>
        </p>
      </nav>

      <form noValidate onSubmit={(e) => void handleSubmit(onValid, onInvalid)(e)} className="space-y-8">
        {/* Honeypot */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        {current === "profile" && (
          <section className="animate-fade-up space-y-6">
            <SectionHeading n="01" title="Personal information">Tell us who you are.</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="fullName" label="Full name" required error={errors.fullName?.message} className="sm:col-span-2">
                <Input id="fullName" autoComplete="name" className={inputClass} aria-invalid={!!errors.fullName} aria-describedby={describedBy("fullName", errors.fullName?.message)} {...register("fullName")} />
              </Field>
              <Field id="email" label="Email" required error={errors.email?.message}>
                <Input id="email" type="email" inputMode="email" autoComplete="email" className={inputClass} aria-invalid={!!errors.email} aria-describedby={describedBy("email", errors.email?.message)} {...register("email")} />
              </Field>
              <Field id="phone" label="Phone number" required error={errors.phone?.message}>
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+216 20 123 456" className={inputClass} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone", errors.phone?.message)} {...register("phone")} />
              </Field>
              <Field id="classYear" label="Class / academic year" required error={errors.classYear?.message}>
                <Controller
                  control={control}
                  name="classYear"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="classYear" className={cn(inputClass, "w-full")} aria-invalid={!!errors.classYear} onBlur={field.onBlur}>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field id="specialization" label="Specialization / major" required error={errors.specialization?.message}>
                <Input id="specialization" className={inputClass} aria-invalid={!!errors.specialization} {...register("specialization")} />
              </Field>
              <Field id="linkedin" label="LinkedIn" optional error={errors.linkedin?.message}>
                <Input id="linkedin" type="url" inputMode="url" placeholder="https://linkedin.com/in/…" className={inputClass} aria-invalid={!!errors.linkedin} {...register("linkedin")} />
              </Field>
              <Field id="portfolio" label="Portfolio / Instagram" optional error={errors.portfolio?.message}>
                <Input id="portfolio" placeholder="https://… or @handle" className={inputClass} aria-invalid={!!errors.portfolio} {...register("portfolio")} />
              </Field>
            </div>
          </section>
        )}

        {current === "skills" && (
          <section className="animate-fade-up space-y-6">
            <SectionHeading n="02" title="Skills">
              What are your strongest skills? Select all that apply — this is how we match you to a mission.
            </SectionHeading>
            <Controller
              control={control}
              name="skillIds"
              render={({ field }) => (
                <fieldset aria-describedby={errors.skillIds ? "skillIds-error" : undefined}>
                  <legend className="sr-only">Skills</legend>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => {
                      const on = field.value.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            field.onChange(on ? field.value.filter((v) => v !== s.id) : [...field.value, s.id]);
                            field.onBlur();
                          }}
                          className={cn(
                            "inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium transition-colors",
                            on
                              ? "border-azure bg-azure/12 text-text"
                              : "border-line-strong bg-surface text-muted hover:border-azure/50 hover:text-text",
                          )}
                        >
                          <span className={cn("grid size-4 place-items-center border", on ? "border-azure bg-azure text-bg" : "border-line-strong")} aria-hidden>
                            {on && <Check className="size-3" strokeWidth={3} />}
                          </span>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  {errors.skillIds && (
                    <p id="skillIds-error" role="alert" className="mt-3 text-xs font-medium text-danger">
                      {errors.skillIds.message}
                    </p>
                  )}
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
                    {field.value.length} selected
                  </p>
                </fieldset>
              )}
            />
            {otherTicked && (
              <Field id="otherSkill" label="Which other skill?" required error={errors.otherSkill?.message} className="max-w-md animate-fade-up">
                <Input id="otherSkill" className={inputClass} aria-invalid={!!errors.otherSkill} {...register("otherSkill")} />
              </Field>
            )}
          </section>
        )}

        {current === "experience" && (
          <section className="animate-fade-up space-y-8">
            <SectionHeading n="03" title="Experience & profile" />

            <YesNo
              id="eventExperience"
              control={control}
              label="Have you participated in event organization before?"
              error={errors.eventExperience?.message}
            />
            {eventExp === "yes" && (
              <Field id="eventExperienceDetails" label="Tell us briefly about your experience." required error={errors.eventExperienceDetails?.message} className="animate-fade-up">
                <Textarea id="eventExperienceDetails" rows={3} className="bg-surface text-base sm:text-sm" aria-invalid={!!errors.eventExperienceDetails} {...register("eventExperienceDetails")} />
              </Field>
            )}

            <YesNo
              id="ambassadorExperience"
              control={control}
              label="Have you previously participated in ESEN / ESEN Ambassadors / ESENet activities?"
              error={errors.ambassadorExperience?.message}
            />
            {ambExp === "yes" && (
              <Field id="ambassadorExperienceDetails" label="Tell us briefly." required error={errors.ambassadorExperienceDetails?.message} className="animate-fade-up">
                <Textarea id="ambassadorExperienceDetails" rows={3} className="bg-surface text-base sm:text-sm" aria-invalid={!!errors.ambassadorExperienceDetails} {...register("ambassadorExperienceDetails")} />
              </Field>
            )}

            <div className="h-px bg-line" />

            <Field
              id="whatCanYouBring"
              label="What can you bring to the ESENet Talent Fair operational team?"
              required
              error={errors.whatCanYouBring?.message}
            >
              <Textarea id="whatCanYouBring" rows={5} className="bg-surface text-base sm:text-sm" aria-invalid={!!errors.whatCanYouBring} {...register("whatCanYouBring")} />
            </Field>
            <Field
              id="additionalInformation"
              label="Anything else the Ambassadors team should know about your profile?"
              optional
              error={errors.additionalInformation?.message}
            >
              <Textarea id="additionalInformation" rows={3} className="bg-surface text-base sm:text-sm" {...register("additionalInformation")} />
            </Field>

            {cvEnabled && (
              <Field id="cv" label="CV (PDF, max 3 MB)" optional error={cvError} hint="Only the ESEN Ambassadors team can open it.">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="cv"
                    className="inline-flex h-11 cursor-pointer items-center gap-2 border border-dashed border-line-strong bg-surface px-4 text-sm text-muted transition-colors hover:border-azure hover:text-text focus-within:outline-2 focus-within:outline-azure"
                  >
                    <Upload className="size-4" />
                    {cvFile ? "Replace file" : "Choose a PDF"}
                    <input id="cv" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={onCvChange} />
                  </label>
                  {cvFile && (
                    <span className="inline-flex items-center gap-2 text-sm">
                      <FileText className="size-4 text-azure" />
                      <span className="max-w-[16rem] truncate">{cvFile.name}</span>
                      <button type="button" onClick={() => setCvFile(null)} className="text-dim hover:text-danger" aria-label="Remove CV">
                        <X className="size-4" />
                      </button>
                    </span>
                  )}
                </div>
              </Field>
            )}
          </section>
        )}

        {current === "commitment" && (
          <section className="animate-fade-up space-y-6">
            <SectionHeading n="04" title="Commitment" />
            <div className="frame-ticks border border-azure/40 bg-linear-to-br from-surface to-navy-2 p-5 sm:p-7">
              <p className="font-mono text-xs tracking-[0.18em] text-azure">AVAILABILITY COMMITMENT</p>
              <p className="mt-3 text-lg leading-relaxed sm:text-xl">
                OC members are required to participate throughout the complete operational period:{" "}
                <span className="font-semibold">J-2, J-1 and Jour J.</span>
              </p>
              <div className="mt-5 grid grid-cols-3 gap-px border border-line bg-line text-center font-display font-extrabold uppercase [font-stretch:112%]">
                {["J-2", "J-1", "JOUR J"].map((d) => (
                  <span key={d} className="bg-bg py-3 text-lg sm:text-2xl">
                    {d}
                  </span>
                ))}
              </div>
              <CheckRow
                id="availabilityConfirmed"
                control={control}
                error={errors.availabilityConfirmed?.message}
                label="I confirm that I am available for the complete ESENet Talent Fair operational period: J-2, J-1 and Jour J."
              />
            </div>

            <div className="border border-line bg-surface p-5 sm:p-7">
              <p className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-muted">
                <ShieldCheck className="size-4" /> CONSENT
              </p>
              <CheckRow
                id="consent"
                control={control}
                error={errors.consent?.message}
                label="I confirm that the information provided is accurate and may be used by the ESEN Ambassadors team for the organization of ESENet Talent Fair 2026."
              />
              <p className="mt-4 text-xs text-muted">
                Read the{" "}
                <Link href="/privacy" target="_blank" className="text-azure underline-offset-2 hover:underline">
                  privacy notice
                </Link>
                .
              </p>
            </div>
          </section>
        )}

        {current === "review" && (
          <section className="animate-fade-up space-y-6">
            <SectionHeading n="05" title="Application review">Check everything once, then submit.</SectionHeading>
            <ReviewBlock title="Profile" onEdit={() => goTo(0)}>
              <ReviewRow k="Full name" v={values.fullName} />
              <ReviewRow k="Email" v={values.email} />
              <ReviewRow k="Phone" v={values.phone} />
              <ReviewRow k="Class / year" v={values.classYear} />
              <ReviewRow k="Specialization" v={values.specialization} />
              {values.linkedin && <ReviewRow k="LinkedIn" v={values.linkedin} />}
              {values.portfolio && <ReviewRow k="Portfolio" v={values.portfolio} />}
            </ReviewBlock>
            <ReviewBlock title="Skills" onEdit={() => goTo(1)}>
              <div className="flex flex-wrap gap-1.5 py-2">
                {values.skillIds.map((id) => (
                  <span key={id} className="border border-line-strong px-2 py-1 text-xs">
                    {skillName(id)}
                    {otherSkill?.id === id && values.otherSkill ? `: ${values.otherSkill}` : ""}
                  </span>
                ))}
              </div>
            </ReviewBlock>
            <ReviewBlock title="Experience & profile" onEdit={() => goTo(2)}>
              <ReviewRow k="Event organization" v={values.eventExperience === "yes" ? values.eventExperienceDetails : "No"} />
              <ReviewRow k="ESEN / Ambassadors / ESENet" v={values.ambassadorExperience === "yes" ? values.ambassadorExperienceDetails : "No"} />
              <ReviewRow k="What you bring" v={values.whatCanYouBring} />
              {values.additionalInformation && <ReviewRow k="Additional" v={values.additionalInformation} />}
              {cvEnabled && <ReviewRow k="CV" v={cvFile?.name ?? "Not provided"} />}
            </ReviewBlock>
            <ReviewBlock title="Commitment" onEdit={() => goTo(3)}>
              <ReviewRow k="J-2 · J-1 · Jour J" v={values.availabilityConfirmed ? "Confirmed — all three days" : "Not confirmed"} />
              <ReviewRow k="Consent" v={values.consent ? "Given" : "Not given"} />
            </ReviewBlock>
          </section>
        )}

        {serverError && (
          <div role="alert" className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {serverError}
          </div>
        )}

        {/* Navigation — sticky on mobile so the next action is always in reach */}
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pt-4">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} disabled={pending}>
              <ArrowLeft /> Back
            </Button>
          ) : (
            <span />
          )}
          {current === "review" ? (
            <Button type="submit" size="xl" disabled={pending} className="min-w-56">
              {pending ? (
                <>
                  <Loader2 className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Submit application <ArrowRight />
                </>
              )}
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={next}>
              Continue <ArrowRight />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function YesNo({
  id,
  control,
  label,
  error,
}: {
  id: "eventExperience" | "ambassadorExperience";
  control: ReturnType<typeof useForm<ApplicationInput, unknown, ApplicationData>>["control"];
  label: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={id}
      render={({ field }) => (
        <fieldset className="space-y-3" aria-describedby={error ? `${id}-error` : undefined}>
          <legend className="text-sm font-semibold">
            {label}
            <span className="ml-1 text-azure" aria-hidden>
              *
            </span>
          </legend>
          <RadioGroup value={field.value ?? ""} onValueChange={(v) => { field.onChange(v); field.onBlur(); }} className="flex gap-2">
            {(["yes", "no"] as const).map((v) => (
              <label
                key={v}
                htmlFor={`${id}-${v}`}
                className={cn(
                  "flex min-h-11 min-w-28 cursor-pointer items-center gap-3 border px-4 text-sm font-medium transition-colors",
                  field.value === v ? "border-azure bg-azure/10" : "border-line-strong bg-surface text-muted hover:border-azure/50",
                )}
              >
                <RadioGroupItem id={`${id}-${v}`} value={v} />
                {v === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </RadioGroup>
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </fieldset>
      )}
    />
  );
}

function CheckRow({
  id,
  control,
  label,
  error,
}: {
  id: "availabilityConfirmed" | "consent";
  control: ReturnType<typeof useForm<ApplicationInput, unknown, ApplicationData>>["control"];
  label: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={id}
      render={({ field }) => (
        <div className="mt-5">
          <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
            <Checkbox
              id={id}
              checked={field.value}
              onCheckedChange={(c) => { field.onChange(c === true); field.onBlur(); }}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              className="mt-0.5 size-5"
            />
            <span className="text-sm leading-relaxed sm:text-base">
              {label}
              <span className="ml-1 text-azure" aria-hidden>
                *
              </span>
            </span>
          </label>
          {error && (
            <p id={`${id}-error`} role="alert" className="mt-2 pl-8 text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    />
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-azure">{title}</h3>
        <Button type="button" variant="ghost" size="xs" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
      </div>
      <dl className="divide-y divide-line px-4 sm:px-5">{children}</dl>
    </div>
  );
}

function ReviewRow({ k, v }: { k: string; v?: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs uppercase tracking-wider text-dim">{k}</dt>
      <dd className="whitespace-pre-line break-words text-sm">{v || "—"}</dd>
    </div>
  );
}
