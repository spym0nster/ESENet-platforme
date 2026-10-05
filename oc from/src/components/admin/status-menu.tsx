"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { setCandidateStatus } from "@/actions/candidates";
import { Button } from "@/components/ui/button";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CandidateStatus } from "@/generated/prisma/enums";
import { useAction } from "@/hooks/use-action";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/constants";

const ACTION_LABEL: Record<CandidateStatus, string> = {
  PENDING: "Back to pending",
  SHORTLISTED: "Shortlist",
  SELECTED: "Select",
  WAITLIST: "Waitlist",
  REJECTED: "Reject",
};

/** Compact status changer for table rows. Reject and un-selecting an assigned person ask for confirmation. */
export function StatusMenu({ candidateId, name, status, assigned }: { candidateId: string; name: string; status: CandidateStatus; assigned: boolean }) {
  const { run, pending } = useAction();
  const [confirm, setConfirm] = useState<CandidateStatus | null>(null);

  const apply = (s: CandidateStatus) => run(() => setCandidateStatus(candidateId, s));
  const choose = (s: CandidateStatus) => {
    if (s === "REJECTED" || (status === "SELECTED" && assigned)) setConfirm(s);
    else void apply(s);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="xs" disabled={pending} aria-label={`Change status of ${name}`}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Status <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs text-muted">Set status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_ORDER.map((s) => (
            <DropdownMenuItem key={s} disabled={s === status} onSelect={() => choose(s)}>
              {s === status ? <Check className="size-3.5" /> : <span className="size-3.5" />}
              {s === status ? STATUS_LABEL[s] : ACTION_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "REJECTED" ? `Reject ${name}?` : `Change ${name} to ${confirm ? STATUS_LABEL[confirm] : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {status === "SELECTED" && assigned
                ? "This person is currently assigned. Their active assignment will be ended (kept in history). "
                : ""}
              The change is recorded in the audit log and can be reverted later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) void apply(confirm);
                setConfirm(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

