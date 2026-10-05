"use client";

import { Loader2, Pencil, Plus, Save } from "lucide-react";
import { useState } from "react";
import { saveMission, saveTeam } from "@/actions/organisation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";

const NONE = "__none";

function FieldRow({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ── Team ──────────────────────────────────────────────────── */

export type TeamFormValue = { id?: string; name: string; description: string; capacity: number; supervisorId: string | null; active: boolean };

export function TeamDialog({ team, staff }: { team?: TeamFormValue; staff: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {team ? (
          <Button variant="ghost" size="xs" aria-label={`Edit ${team.name}`}>
            <Pencil /> Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{team ? `Edit ${team.name}` : "New team"}</DialogTitle>
          <DialogDescription>Capacity drives the seat counters on the dashboard and assignment screens.</DialogDescription>
        </DialogHeader>
        {open && <TeamForm team={team} staff={staff} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TeamForm({ team, staff, onDone }: { team?: TeamFormValue; staff: { id: string; name: string }[]; onDone: () => void }) {
  const { run, pending } = useAction();
  const [v, setV] = useState<TeamFormValue>(team ?? { name: "", description: "", capacity: 0, supervisorId: null, active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => saveTeam(v));
        if (r.ok) onDone();
        else setErrors(r.fieldErrors ?? {});
      }}
    >
      <FieldRow id="t-name" label="Name" error={errors.name}>
        <Input id="t-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className="bg-bg" maxLength={80} required />
      </FieldRow>
      <FieldRow id="t-desc" label="Description" error={errors.description}>
        <Textarea id="t-desc" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={2} className="bg-bg" maxLength={500} />
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow id="t-cap" label="Capacity (people)" error={errors.capacity}>
          <Input id="t-cap" type="number" min={0} max={500} value={v.capacity} onChange={(e) => setV({ ...v, capacity: Number(e.target.value) })} className="bg-bg" />
        </FieldRow>
        <FieldRow id="t-sup" label="Ambassador in charge">
          <Select value={v.supervisorId ?? NONE} onValueChange={(x) => setV({ ...v, supervisorId: x === NONE ? null : x })}>
            <SelectTrigger id="t-sup" className="w-full bg-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nobody</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <label className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-sm">
        Active (shown in assignment pickers)
        <Switch checked={v.active} onCheckedChange={(c) => setV({ ...v, active: c })} />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Save team
      </Button>
    </form>
  );
}

/* ── Mission ───────────────────────────────────────────────── */

export type MissionFormValue = {
  id?: string;
  name: string;
  description: string;
  capacity: number;
  teamId: string | null;
  active: boolean;
  skills: { skillId: string; weight: number }[];
};

const WEIGHTS = [
  { w: 0, label: "—" },
  { w: 1, label: "Useful" },
  { w: 2, label: "Core" },
  { w: 3, label: "Critical" },
];

export function MissionDialog({
  mission,
  teams,
  skills,
}: {
  mission?: MissionFormValue;
  teams: { id: string; name: string }[];
  skills: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mission ? (
          <Button variant="ghost" size="xs" aria-label={`Edit ${mission.name}`}>
            <Pencil /> Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New mission
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mission ? `Edit ${mission.name}` : "New mission"}</DialogTitle>
          <DialogDescription>Recommended skills and their weights drive the compatibility score.</DialogDescription>
        </DialogHeader>
        {open && <MissionForm mission={mission} teams={teams} skills={skills} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function MissionForm({
  mission,
  teams,
  skills,
  onDone,
}: {
  mission?: MissionFormValue;
  teams: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  onDone: () => void;
}) {
  const { run, pending } = useAction();
  const [v, setV] = useState<MissionFormValue>(mission ?? { name: "", description: "", capacity: 0, teamId: null, active: true, skills: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const weightOf = (id: string) => v.skills.find((s) => s.skillId === id)?.weight ?? 0;
  const setWeight = (id: string, w: number) =>
    setV({ ...v, skills: w === 0 ? v.skills.filter((s) => s.skillId !== id) : [...v.skills.filter((s) => s.skillId !== id), { skillId: id, weight: w }] });

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => saveMission(v));
        if (r.ok) onDone();
        else setErrors(r.fieldErrors ?? {});
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow id="m-name" label="Name" error={errors.name}>
          <Input id="m-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className="bg-bg" maxLength={80} required />
        </FieldRow>
        <div className="grid grid-cols-2 gap-4">
          <FieldRow id="m-cap" label="Capacity" error={errors.capacity}>
            <Input id="m-cap" type="number" min={0} max={500} value={v.capacity} onChange={(e) => setV({ ...v, capacity: Number(e.target.value) })} className="bg-bg" />
          </FieldRow>
          <FieldRow id="m-team" label="Default team">
            <Select value={v.teamId ?? NONE} onValueChange={(x) => setV({ ...v, teamId: x === NONE ? null : x })}>
              <SelectTrigger id="m-team" className="w-full bg-bg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      </div>
      <FieldRow id="m-desc" label="Description">
        <Textarea id="m-desc" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={2} className="bg-bg" maxLength={500} />
      </FieldRow>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Recommended skills</legend>
        <div className="divide-y divide-line border border-line">
          {skills.map((s) => {
            const w = weightOf(s.id);
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                <span className={cn("text-sm", w ? "text-text" : "text-muted")}>{s.name}</span>
                <div className="flex gap-px bg-line" role="radiogroup" aria-label={`${s.name} weight`}>
                  {WEIGHTS.map((o) => (
                    <button
                      key={o.w}
                      type="button"
                      role="radio"
                      aria-checked={w === o.w}
                      onClick={() => setWeight(s.id, o.w)}
                      className={cn(
                        "min-w-14 bg-bg px-2 py-1 text-[11px] transition-colors",
                        w === o.w ? (o.w === 0 ? "bg-surface-3 text-text" : o.w >= 2 ? "bg-green/20 text-green" : "bg-azure/20 text-azure") : "text-dim hover:text-text",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-sm">
        Active (shown in recommendations and pickers)
        <Switch checked={v.active} onCheckedChange={(c) => setV({ ...v, active: c })} />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Save mission
      </Button>
    </form>
  );
}
