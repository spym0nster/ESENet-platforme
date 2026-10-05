"use client";

import { Copy, KeyRound, Loader2, Plus, Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  addSkill,
  changeOwnPassword,
  createStaffUser,
  resetStaffPassword,
  setDayDates,
  setSkillActive,
  updateSettings,
  updateStaffUser,
} from "@/actions/settings";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { OperationalDay, Role } from "@/generated/prisma/enums";
import { useAction } from "@/hooks/use-action";
import { DAY_LABEL, DAY_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";

const AUTO = "__auto";

/* ── Platform ──────────────────────────────────────────────── */

export function PlatformSettings({
  initial,
}: {
  initial: { applicationsOpen: boolean; allowMultipleAssignments: boolean; currentDayOverride: OperationalDay | null };
}) {
  const { run, pending } = useAction();
  const [v, setV] = useState(initial);
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  return (
    <div className="space-y-4">
      <Toggle
        label="Applications open"
        hint="When off, the public form shows “Applications closed” and submissions are refused server-side."
        checked={v.applicationsOpen}
        onChange={(c) => setV({ ...v, applicationsOpen: c })}
      />
      <Toggle
        label="Allow multiple active assignments per person"
        hint="Off by default — one person, one mission. Turn on only if someone genuinely covers two missions."
        checked={v.allowMultipleAssignments}
        onChange={(c) => setV({ ...v, allowMultipleAssignments: c })}
      />
      <div className="flex flex-col gap-2 border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Current operational day</p>
          <p className="text-xs text-muted">Automatic uses the dates below. Override to force the Operations screen onto a day.</p>
        </div>
        <Select value={v.currentDayOverride ?? AUTO} onValueChange={(x) => setV({ ...v, currentDayOverride: x === AUTO ? null : (x as OperationalDay) })}>
          <SelectTrigger className="w-full bg-bg sm:w-48" aria-label="Current operational day">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO}>Automatic (by date)</SelectItem>
            {DAY_ORDER.map((d) => (
              <SelectItem key={d} value={d}>
                {DAY_LABEL[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button disabled={!dirty || pending} onClick={() => void run(() => updateSettings(v))}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
        </Button>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-line p-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function DayDates({ initial }: { initial: Record<OperationalDay, string> }) {
  const { run, pending } = useAction();
  const [v, setV] = useState(initial);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => setDayDates(v));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {DAY_ORDER.map((d) => (
          <div key={d} className="space-y-2">
            <label htmlFor={`date-${d}`} className="font-mono text-xs tracking-[0.14em] text-azure">
              {DAY_LABEL[d]}
            </label>
            <Input id={`date-${d}`} type="date" value={v[d]} onChange={(e) => setV({ ...v, [d]: e.target.value })} className="bg-bg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save dates
        </Button>
      </div>
    </form>
  );
}

/* ── Staff ─────────────────────────────────────────────────── */

function TempPassword({ value }: { value: string }) {
  return (
    <div className="space-y-2 border border-green/40 bg-green/8 p-4">
      <p className="text-sm font-semibold text-green">Temporary password — shown once</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all bg-bg px-3 py-2 font-mono text-sm">{value}</code>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Copy password"
          onClick={() => navigator.clipboard.writeText(value).then(() => toast.success("Copied"))}
        >
          <Copy />
        </Button>
      </div>
      <p className="text-xs text-muted">Share it privately. They should change it from “My account” after signing in.</p>
    </div>
  );
}

export function NewStaffDialog() {
  const [open, setOpen] = useState(false);
  const { run, pending } = useAction();
  const [v, setV] = useState<{ name: string; email: string; role: Role }>({ name: "", email: "", role: "AMBASSADOR" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pwd, setPwd] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setPwd(null);
          setV({ name: "", email: "", role: "AMBASSADOR" });
          setErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> Add staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a staff account</DialogTitle>
          <DialogDescription>Ambassadors review and assign. Admins also manage missions, teams, settings and exports.</DialogDescription>
        </DialogHeader>
        {pwd ? (
          <TempPassword value={pwd} />
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => createStaffUser(v));
              if (r.ok && r.data) setPwd(r.data.tempPassword);
              else if (!r.ok) setErrors(r.fieldErrors ?? {});
            }}
          >
            <div className="space-y-2">
              <label htmlFor="u-name" className="text-sm font-semibold">Name</label>
              <Input id="u-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className="bg-bg" required maxLength={80} />
              {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="u-email" className="text-sm font-semibold">Email</label>
              <Input id="u-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className="bg-bg" required />
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="u-role" className="text-sm font-semibold">Role</label>
              <Select value={v.role} onValueChange={(r) => setV({ ...v, role: r as Role })}>
                <SelectTrigger id="u-role" className="w-full bg-bg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMBASSADOR">Ambassador</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Plus />} Create account
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StaffRowControls({ id, name, role, active, self }: { id: string; name: string; role: Role; active: boolean; self: boolean }) {
  const { run, pending } = useAction();
  const [pwd, setPwd] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select value={role} disabled={pending || self} onValueChange={(r) => void run(() => updateStaffUser({ id, role: r as Role, active }))}>
        <SelectTrigger className="h-8 w-36 bg-bg" aria-label={`Role of ${name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AMBASSADOR">Ambassador</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <label className={cn("flex items-center gap-2 text-xs", self && "opacity-50")}>
        <Switch checked={active} disabled={pending || self} onCheckedChange={(c) => void run(() => updateStaffUser({ id, role, active: c }))} aria-label={`${name} active`} />
        {active ? "Active" : "Disabled"}
      </label>
      <AlertDialog onOpenChange={(o) => !o && setPwd(null)}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="xs" disabled={pending}>
            <KeyRound /> Reset
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password for {name}?</AlertDialogTitle>
            <AlertDialogDescription>Their current password stops working immediately. A temporary one is shown once.</AlertDialogDescription>
          </AlertDialogHeader>
          {pwd && <TempPassword value={pwd} />}
          <AlertDialogFooter>
            <AlertDialogCancel>{pwd ? "Done" : "Cancel"}</AlertDialogCancel>
            {!pwd && (
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  const r = await run(() => resetStaffPassword(id), { refresh: false });
                  if (r.ok && r.data) setPwd(r.data.tempPassword);
                }}
              >
                Reset password
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Skills ────────────────────────────────────────────────── */

export function SkillsManager({ skills }: { skills: { id: string; name: string; active: boolean; isOther: boolean; used: number }[] }) {
  const { run, pending } = useAction();
  const [name, setName] = useState("");
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line border border-line">
        {skills.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className={cn("text-sm", !s.active && "text-dim line-through")}>
              {s.name}
              <span className="ml-2 font-mono text-[10px] text-dim">{s.used} candidates</span>
            </span>
            <Switch checked={s.active} disabled={pending} onCheckedChange={(c) => void run(() => setSkillActive(s.id, c))} aria-label={`Show ${s.name} on the form`} />
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await run(() => addSkill(name));
          if (r.ok) setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New skill name" className="bg-bg" maxLength={60} aria-label="New skill name" />
        <Button type="submit" variant="outline" disabled={pending || name.trim().length < 2}>
          <Plus /> Add
        </Button>
      </form>
      <p className="text-xs text-dim">Hidden skills disappear from the application form but stay on existing applications.</p>
    </div>
  );
}

/* ── Own password ──────────────────────────────────────────── */

export function ChangePasswordForm() {
  const { run, pending } = useAction();
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const field = (key: keyof typeof v, label: string, auto: string) => (
    <div className="space-y-2">
      <label htmlFor={`pw-${key}`} className="text-sm font-semibold">{label}</label>
      <Input id={`pw-${key}`} type="password" autoComplete={auto} value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} className="bg-bg" required />
      {errors[key] && <p className="text-xs text-danger">{errors[key]}</p>}
    </div>
  );
  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => changeOwnPassword(v), { refresh: false });
        if (r.ok) {
          setV({ current: "", next: "", confirm: "" });
          setErrors({});
        } else setErrors(r.fieldErrors ?? {});
      }}
    >
      {field("current", "Current password", "current-password")}
      {field("next", "New password (12+ characters)", "new-password")}
      {field("confirm", "Confirm new password", "new-password")}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <KeyRound />} Change password
      </Button>
    </form>
  );
}
