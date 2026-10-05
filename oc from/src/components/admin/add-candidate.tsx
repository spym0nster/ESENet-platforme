"use client";

import { Check, Loader2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCandidateManually } from "@/actions/manual-candidate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateStatus } from "@/generated/prisma/enums";
import { useAction } from "@/hooks/use-action";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CLASS_YEARS } from "@/lib/validation/application";

type Skill = { id: string; name: string };

type Form = {
  fullName: string;
  email: string;
  phone: string;
  classYear: string;
  specialization: string;
  linkedin: string;
  portfolio: string;
  skillIds: string[];
  eventExperience: boolean;
  eventExperienceDetails: string;
  ambassadorExperience: boolean;
  ambassadorExperienceDetails: string;
  whatCanYouBring: string;
  internalNotes: string;
  status: CandidateStatus;
  availabilityConfirmed: boolean;
};

const EMPTY: Form = {
  fullName: "",
  email: "",
  phone: "",
  classYear: "",
  specialization: "",
  linkedin: "",
  portfolio: "",
  skillIds: [],
  eventExperience: false,
  eventExperienceDetails: "",
  ambassadorExperience: false,
  ambassadorExperienceDetails: "",
  whatCanYouBring: "",
  internalNotes: "",
  status: "PENDING",
  availabilityConfirmed: false,
};

export function AddCandidateDialog({ skills }: { skills: Skill[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Add candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a candidate manually</DialogTitle>
          <DialogDescription>For someone who applied outside the form. They go through the same review, selection and assignment steps.</DialogDescription>
        </DialogHeader>
        {open && <AddForm skills={skills} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Row({ id, label, error, children, className }: { id: string; label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function AddForm({ skills, onDone }: { skills: Skill[]; onDone: () => void }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [v, setV] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Form>(k: K, val: Form[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await run(() => createCandidateManually({ ...v, classYear: v.classYear as (typeof CLASS_YEARS)[number] }), { refresh: false });
        if (res.ok) {
          onDone();
          if (res.data?.id) router.push(`/admin/candidates/${res.data.id}`);
          else router.refresh();
        } else setErrors(res.fieldErrors ?? {});
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Row id="m-name" label="Full name" error={errors.fullName} className="sm:col-span-2">
          <Input id="m-name" value={v.fullName} onChange={(e) => set("fullName", e.target.value)} className="bg-bg" maxLength={120} />
        </Row>
        <Row id="m-email" label="Email" error={errors.email}>
          <Input id="m-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} className="bg-bg" />
        </Row>
        <Row id="m-phone" label="Phone" error={errors.phone}>
          <Input id="m-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+216 20 123 456" className="bg-bg" />
        </Row>
        <Row id="m-class" label="Class / year" error={errors.classYear}>
          <Select value={v.classYear} onValueChange={(x) => set("classYear", x)}>
            <SelectTrigger id="m-class" className="w-full bg-bg">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {CLASS_YEARS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row id="m-spec" label="Specialization" error={errors.specialization}>
          <Input id="m-spec" value={v.specialization} onChange={(e) => set("specialization", e.target.value)} className="bg-bg" maxLength={120} />
        </Row>
        <Row id="m-linkedin" label="LinkedIn (optional)" error={errors.linkedin}>
          <Input id="m-linkedin" value={v.linkedin} onChange={(e) => set("linkedin", e.target.value)} className="bg-bg" />
        </Row>
        <Row id="m-portfolio" label="Portfolio / Instagram (optional)" error={errors.portfolio}>
          <Input id="m-portfolio" value={v.portfolio} onChange={(e) => set("portfolio", e.target.value)} className="bg-bg" />
        </Row>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Skills</legend>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => {
            const on = v.skillIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => set("skillIds", on ? v.skillIds.filter((x) => x !== s.id) : [...v.skillIds, s.id])}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 border px-3 text-xs transition-colors",
                  on ? "border-azure bg-azure/12 text-text" : "border-line-strong text-muted hover:border-azure/50 hover:text-text",
                )}
              >
                {on && <Check className="size-3" strokeWidth={3} />}
                {s.name}
              </button>
            );
          })}
        </div>
        {errors.skillIds && <p className="text-xs text-danger">{errors.skillIds}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-sm">
            Event organization experience
            <Switch checked={v.eventExperience} onCheckedChange={(c) => set("eventExperience", c)} />
          </label>
          {v.eventExperience && (
            <Textarea value={v.eventExperienceDetails} onChange={(e) => set("eventExperienceDetails", e.target.value)} rows={2} className="bg-bg" placeholder="Details (optional)" aria-label="Event experience details" />
          )}
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-sm">
            ESEN / Ambassadors / ESENet experience
            <Switch checked={v.ambassadorExperience} onCheckedChange={(c) => set("ambassadorExperience", c)} />
          </label>
          {v.ambassadorExperience && (
            <Textarea value={v.ambassadorExperienceDetails} onChange={(e) => set("ambassadorExperienceDetails", e.target.value)} rows={2} className="bg-bg" placeholder="Details (optional)" aria-label="ESEN experience details" />
          )}
        </div>
      </div>

      <Row id="m-bring" label="What they bring (optional)" error={errors.whatCanYouBring}>
        <Textarea id="m-bring" value={v.whatCanYouBring} onChange={(e) => set("whatCanYouBring", e.target.value)} rows={3} className="bg-bg" maxLength={1500} />
      </Row>
      <Row id="m-notes" label="Internal notes (optional)" error={errors.internalNotes}>
        <Textarea id="m-notes" value={v.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} rows={2} className="bg-bg" maxLength={2000} />
      </Row>

      <Row id="m-status" label="Starting status">
        <Select value={v.status} onValueChange={(x) => set("status", x as CandidateStatus)}>
          <SelectTrigger id="m-status" className="w-full bg-bg sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <div className="border border-azure/40 bg-surface-2 p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <Checkbox checked={v.availabilityConfirmed} onCheckedChange={(c) => set("availabilityConfirmed", c === true)} className="mt-0.5" />
          <span>
            This person confirmed they are available for the complete operational period: <strong>J-2, J-1 and Jour J</strong>, and agreed to the use of their data for the OC.
          </span>
        </label>
        {errors.availabilityConfirmed && <p className="mt-2 text-xs text-danger">{errors.availabilityConfirmed}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Add candidate
      </Button>
    </form>
  );
}
