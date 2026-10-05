"use client";

import { Check, ChevronDown, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { deleteScheduleItem, saveScheduleDay, saveScheduleItem } from "@/actions/schedule";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OperationalDay } from "@/generated/prisma/enums";
import { useAction } from "@/hooks/use-action";
import { DAY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NONE = "__none";

type Opt = { id: string; name: string };
export type ScheduleItemValue = {
  id?: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  notes: string;
  missionId: string | null;
  teamId: string | null;
  people: string[];
};

export function ScheduleItemDialog({
  day,
  item,
  missions,
  teams,
  members,
}: {
  day: OperationalDay;
  item?: ScheduleItemValue;
  missions: Opt[];
  teams: Opt[];
  members: Opt[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.title}`}>
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Add to {DAY_LABEL[day]}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit schedule item" : `New item — ${DAY_LABEL[day]}`}</DialogTitle>
          <DialogDescription>Time, mission, team, responsible people, location and notes.</DialogDescription>
        </DialogHeader>
        {open && <ItemForm day={day} item={item} missions={missions} teams={teams} members={members} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({
  day,
  item,
  missions,
  teams,
  members,
  onDone,
}: {
  day: OperationalDay;
  item?: ScheduleItemValue;
  missions: Opt[];
  teams: Opt[];
  members: Opt[];
  onDone: () => void;
}) {
  const { run, pending } = useAction();
  const [v, setV] = useState<ScheduleItemValue>(
    item ?? { startTime: "08:00", endTime: "", title: "", location: "", notes: "", missionId: null, teamId: null, people: [] },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const filtered = useMemo(() => members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).slice(0, 80), [members, q]);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "—";

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => saveScheduleItem({ ...v, day }));
        if (r.ok) onDone();
        else setErrors(r.fieldErrors ?? {});
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Row id="s-start" label="Start" error={errors.startTime}>
          <Input id="s-start" type="time" required value={v.startTime} onChange={(e) => setV({ ...v, startTime: e.target.value })} className="bg-bg" />
        </Row>
        <Row id="s-end" label="End (optional)" error={errors.endTime}>
          <Input id="s-end" type="time" value={v.endTime} onChange={(e) => setV({ ...v, endTime: e.target.value })} className="bg-bg" />
        </Row>
      </div>
      <Row id="s-title" label="Title" error={errors.title}>
        <Input id="s-title" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className="bg-bg" maxLength={120} placeholder="What happens" />
      </Row>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row id="s-mission" label="Mission">
          <Select value={v.missionId ?? NONE} onValueChange={(x) => setV({ ...v, missionId: x === NONE ? null : x })}>
            <SelectTrigger id="s-mission" className="w-full bg-bg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {missions.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Row>
        <Row id="s-team" label="Team">
          <Select value={v.teamId ?? NONE} onValueChange={(x) => setV({ ...v, teamId: x === NONE ? null : x })}>
            <SelectTrigger id="s-team" className="w-full bg-bg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Row>
      </div>
      <Row id="s-loc" label="Location">
        <Input id="s-loc" value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} className="bg-bg" maxLength={120} />
      </Row>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Responsible people</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between bg-bg font-normal">
              {v.people.length ? `${v.people.length} selected` : "Choose OC members"}
              <ChevronDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search selected members…" className="mb-1 h-8 bg-bg" aria-label="Search members" />
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 && <p className="px-2 py-3 text-xs text-muted">No selected members match.</p>}
              {filtered.map((m) => {
                const on = v.people.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setV({ ...v, people: on ? v.people.filter((p) => p !== m.id) : [...v.people, m.id] })}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-surface-3"
                  >
                    <span className={cn("grid size-4 place-items-center border", on ? "border-azure bg-azure text-bg" : "border-line-strong")}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                    {m.name}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        {v.people.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {v.people.map((id) => (
              <span key={id} className="inline-flex h-6 items-center border border-line-strong px-2 text-xs">{nameOf(id)}</span>
            ))}
          </div>
        )}
      </div>

      <Row id="s-notes" label="Notes">
        <Textarea id="s-notes" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} rows={2} className="bg-bg" maxLength={1000} />
      </Row>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
      </Button>
    </form>
  );
}

function Row({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function DeleteScheduleItem({ id, title }: { id: string; title: string }) {
  const { run, pending } = useAction();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-dim hover:text-danger" aria-label={`Remove ${title}`} disabled={pending}>
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>The item disappears from the schedule. Its content is kept in the audit log.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void run(() => deleteScheduleItem(id))}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DayDialog({ day, title, notes }: { day: OperationalDay; title: string; notes: string }) {
  const [open, setOpen] = useState(false);
  const { run, pending } = useAction();
  const [v, setV] = useState({ title, notes });
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setV({ title, notes }); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil /> Edit day</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{DAY_LABEL[day]}</DialogTitle>
          <DialogDescription>Title and briefing notes shown on the schedule and Operations screen. Dates are set in Settings.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await run(() => saveScheduleDay({ day, ...v }));
            if (r.ok) setOpen(false);
          }}
        >
          <Row id="d-title" label="Title">
            <Input id="d-title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className="bg-bg" maxLength={80} required />
          </Row>
          <Row id="d-notes" label="Briefing notes">
            <Textarea id="d-notes" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} rows={5} className="bg-bg" maxLength={2000} />
          </Row>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
