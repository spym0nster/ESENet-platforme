"use client";

import { Ban, Clock, Flag, FlagOff, Loader2, Mail, RotateCcw, Save, Star, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { endAssignment, updateAssignmentDetails } from "@/actions/assignments";
import { sendDecisionEmail } from "@/actions/emails";
import { setCandidateNotes, setCandidateStatus, setContactReason } from "@/actions/candidates";
import { AssignForm, type AssignMissionOption, type AssignTeamOption } from "@/components/admin/assign-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateStatus } from "@/generated/prisma/enums";
import { useAction } from "@/hooks/use-action";
import { STATUS_LABEL } from "@/lib/constants";

/* ── Status actions ─────────────────────────────────────────── */

const BUTTONS: { status: CandidateStatus; label: string; icon: typeof Star; variant: "outline" | "success" | "destructive" }[] = [
  { status: "SHORTLISTED", label: "Shortlist", icon: Star, variant: "outline" },
  { status: "SELECTED", label: "Select", icon: UserCheck, variant: "success" },
  { status: "WAITLIST", label: "Waitlist", icon: Clock, variant: "outline" },
  { status: "REJECTED", label: "Reject", icon: Ban, variant: "destructive" },
];

export function StatusActions({ candidateId, name, status, assigned }: { candidateId: string; name: string; status: CandidateStatus; assigned: boolean }) {
  const { run, pending } = useAction();
  const [confirm, setConfirm] = useState<CandidateStatus | null>(null);

  const apply = (s: CandidateStatus) => void run(() => setCandidateStatus(candidateId, s));
  const choose = (s: CandidateStatus) => (s === "REJECTED" || (status === "SELECTED" && assigned) ? setConfirm(s) : apply(s));

  return (
    <div className="flex flex-wrap gap-2">
      {BUTTONS.map((b) => {
        const Icon = b.icon;
        const current = b.status === status;
        return (
          <Button key={b.status} variant={current ? "secondary" : b.variant} size="sm" disabled={pending || current} onClick={() => choose(b.status)} aria-pressed={current}>
            <Icon /> {current ? STATUS_LABEL[b.status] : b.label}
          </Button>
        );
      })}
      {status !== "PENDING" && (
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => choose("PENDING")}>
          <RotateCcw /> Back to pending
        </Button>
      )}
      {pending && <Loader2 className="size-4 animate-spin self-center text-dim" />}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "REJECTED" ? `Reject ${name}?` : `Change status to ${confirm ? STATUS_LABEL[confirm] : ""}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {status === "SELECTED" && assigned && "Their active assignment will be ended and kept in history. "}
              The application is not deleted — this is a status change, recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && apply(confirm)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Assign / reassign / end ────────────────────────────────── */

type ActiveAssignment = { id: string; missionName: string; teamName: string; subRole: string | null; isLead: boolean; notes: string | null };

export function AssignmentControls({
  candidateId,
  candidateName,
  selected,
  active,
  missions,
  teams,
  canAddMore,
  defaultMissionId,
}: {
  candidateId: string;
  candidateName: string;
  selected: boolean;
  active: ActiveAssignment[];
  missions: AssignMissionOption[];
  teams: AssignTeamOption[];
  canAddMore: boolean;
  defaultMissionId?: string;
}) {
  const [open, setOpen] = useState<null | { replace: ActiveAssignment | null }>(null);
  const [ending, setEnding] = useState<ActiveAssignment | null>(null);
  const [editing, setEditing] = useState<ActiveAssignment | null>(null);
  const { run, pending } = useAction();

  if (!selected) {
    return <p className="text-sm text-muted">Only <span className="text-green">selected</span> candidates can be assigned. Select this candidate first.</p>;
  }

  return (
    <div className="space-y-3">
      {active.map((a) => (
        <div key={a.id} className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen({ replace: a })}>
            <RotateCcw /> Reassign
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
            Edit role
          </Button>
          <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setEnding(a)}>
            <UserMinus /> Unassign
          </Button>
        </div>
      ))}
      {(active.length === 0 || canAddMore) && (
        <Button size="sm" onClick={() => setOpen({ replace: null })}>
          <UserPlus /> {active.length ? "Add another assignment" : "Assign mission"}
        </Button>
      )}

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.replace ? "Reassign" : "Assign"} {candidateName}</DialogTitle>
            <DialogDescription>Recommended missions are listed first. The final decision is yours.</DialogDescription>
          </DialogHeader>
          {open && (
            <AssignForm
              candidateId={candidateId}
              candidateName={candidateName}
              missions={missions}
              teams={teams}
              defaultMissionId={open.replace ? undefined : defaultMissionId}
              replace={open.replace ? { id: open.replace.id, missionName: open.replace.missionName, teamName: open.replace.teamName } : null}
              onDone={() => setOpen(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <EditDetailsDialog assignment={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={ending !== null} onOpenChange={(o) => !o && setEnding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign {candidateName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from {ending?.missionName} / {ending?.teamName} and become unassigned. The assignment stays in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => ending && void run(() => endAssignment(ending.id, "Unassigned"))}>
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditDetailsDialog({ assignment, onClose }: { assignment: ActiveAssignment | null; onClose: () => void }) {
  return (
    <Dialog open={assignment !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit assignment</DialogTitle>
          <DialogDescription>
            {assignment?.missionName} / {assignment?.teamName}. To change mission or team, use Reassign.
          </DialogDescription>
        </DialogHeader>
        {assignment && <EditDetailsForm key={assignment.id} a={assignment} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditDetailsForm({ a, onDone }: { a: ActiveAssignment; onDone: () => void }) {
  const { run, pending } = useAction();
  const [subRole, setSubRole] = useState(a.subRole ?? "");
  const [isLead, setIsLead] = useState(a.isLead);
  const [notes, setNotes] = useState(a.notes ?? "");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(() => updateAssignmentDetails({ assignmentId: a.id, subRole, isLead, notes }));
        if (r.ok) onDone();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="edit-role" className="text-sm font-semibold">Role / sub-role</label>
        <Input id="edit-role" value={subRole} onChange={(e) => setSubRole(e.target.value)} className="bg-bg" maxLength={120} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={isLead} onCheckedChange={(c) => setIsLead(c === true)} /> Team leader
      </label>
      <div className="space-y-2">
        <label htmlFor="edit-notes" className="text-sm font-semibold">Notes</label>
        <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="bg-bg" maxLength={1000} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
      </Button>
    </form>
  );
}

/* ── Internal notes ─────────────────────────────────────────── */

export function NotesEditor({ candidateId, initial }: { candidateId: string; initial: string }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;
  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="Visible to ESEN Ambassadors staff only."
        className="bg-bg"
        aria-label="Internal notes"
      />
      <div className="flex justify-end">
        <Button size="sm" variant="outline" disabled={!dirty || pending} onClick={() => void run(() => setCandidateNotes(candidateId, value))}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save notes
        </Button>
      </div>
    </div>
  );
}

/* ── People to contact flag ─────────────────────────────────── */

export function ContactFlag({ candidateId, reason }: { candidateId: string; reason: string | null }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState("");
  if (reason) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border border-gold/40 bg-gold/8 px-3 py-2">
        <p className="text-sm text-gold">
          <Flag className="mr-2 inline size-4" />
          {reason}
        </p>
        <Button size="xs" variant="ghost" disabled={pending} onClick={() => void run(() => setContactReason(candidateId, null))}>
          <FlagOff /> Clear
        </Button>
      </div>
    );
  }
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) void run(() => setContactReason(candidateId, value.trim())).then((r) => r.ok && setValue(""));
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Reason to contact (e.g. confirm T-shirt size)" className="h-8 bg-bg text-sm" maxLength={300} aria-label="Reason to contact" />
      <Button size="sm" variant="outline" type="submit" disabled={pending || !value.trim()}>
        <Flag /> Flag
      </Button>
    </form>
  );
}

/* ── Decision emails ────────────────────────────────────────── */

export type SentInfo = { accepted: string | null; rejected: string | null };

export function EmailButtons({
  candidateId,
  name,
  status,
  emailEnabled,
  sent,
}: {
  candidateId: string;
  name: string;
  status: CandidateStatus;
  emailEnabled: boolean;
  sent: SentInfo;
}) {
  const { run, pending } = useAction();
  const [confirm, setConfirm] = useState<"accepted" | "rejected" | null>(null);

  const item = (kind: "accepted" | "rejected", label: string, ready: boolean, hint: string) => (
    <div className="space-y-1.5">
      <Button
        variant={kind === "accepted" ? "success" : "outline"}
        size="sm"
        className="w-full"
        disabled={!emailEnabled || !ready || pending}
        onClick={() => setConfirm(kind)}
      >
        <Mail /> {label}
      </Button>
      <p className="text-[11px] leading-snug text-dim">{sent[kind] ? `Last sent ${sent[kind]}` : ready ? "Not sent yet." : hint}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {!emailEnabled && (
        <p className="border border-gold/40 bg-gold/8 px-3 py-2 text-xs text-gold">
          Email is not configured yet (SMTP). The buttons stay disabled until an admin adds it.
        </p>
      )}
      {item("accepted", "Send acceptance email", status === "SELECTED", "Select this candidate first.")}
      {item("rejected", "Send rejection email", status === "REJECTED", "Reject this candidate first.")}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send the {confirm} email to {name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "accepted"
                ? "A welcome message: we are happy to tell them they are part of the OC team, with a reminder of J-2, J-1 and Jour J."
                : "A polite message saying we cannot offer them a place in the OC team this year."}{" "}
              The send is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && void run(() => sendDecisionEmail(candidateId, confirm))}>Send email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
