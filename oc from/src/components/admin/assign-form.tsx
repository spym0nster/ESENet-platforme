"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { assignCandidate } from "@/actions/assignments";
import { ScorePill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";

export type AssignMissionOption = {
  id: string;
  name: string;
  score: number;
  capacity: number;
  assigned: number;
  teamId: string | null;
};
export type AssignTeamOption = { id: string; name: string; capacity: number; used: number };

/**
 * Candidate → Mission → Team → optional role → save.
 * Missions are listed best-match first with their score; picking a mission pre-selects its default team.
 */
export function AssignForm({
  candidateId,
  candidateName,
  missions,
  teams,
  replace,
  defaultMissionId,
  onDone,
}: {
  candidateId: string;
  candidateName: string;
  missions: AssignMissionOption[];
  teams: AssignTeamOption[];
  /** Set when reassigning: the active assignment to replace. */
  replace?: { id: string; missionName: string; teamName: string } | null;
  defaultMissionId?: string;
  onDone?: () => void;
}) {
  const { run, pending } = useAction();
  const initialMission = missions.find((m) => m.id === defaultMissionId) ?? null;
  const [missionId, setMissionId] = useState(initialMission?.id ?? "");
  const [teamId, setTeamId] = useState(initialMission?.teamId ?? "");
  const [subRole, setSubRole] = useState("");
  const [isLead, setIsLead] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mission = missions.find((m) => m.id === missionId);
  const team = teams.find((t) => t.id === teamId);

  function onMission(id: string) {
    setMissionId(id);
    const m = missions.find((x) => x.id === id);
    if (m?.teamId) setTeamId(m.teamId);
    setErrors({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!missionId) local.missionId = "Choose a mission.";
    if (!teamId) local.teamId = "Choose a team.";
    setErrors(local);
    if (Object.keys(local).length) return;
    const res = await run(() =>
      assignCandidate({ candidateId, missionId, teamId, subRole, isLead, notes, replaceAssignmentId: replace?.id ?? null }),
    );
    if (res.ok) onDone?.();
    else if (res.fieldErrors) setErrors(res.fieldErrors);
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {replace && (
        <p className="border border-gold/40 bg-gold/8 px-3 py-2 text-xs text-gold">
          Reassigning {candidateName} from <strong>{replace.missionName}</strong> / {replace.teamName}. The previous assignment is kept in history.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor={`mission-${candidateId}`} className="text-sm font-semibold">
          Mission
        </label>
        <Select value={missionId} onValueChange={onMission}>
          <SelectTrigger id={`mission-${candidateId}`} className="h-10 w-full bg-bg" aria-invalid={!!errors.missionId}>
            <SelectValue placeholder="Choose a mission (best match first)" />
          </SelectTrigger>
          <SelectContent>
            {missions.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex w-full items-center gap-3">
                  <ScorePill score={m.score} className="h-5 min-w-10 text-[10px]" />
                  <span>{m.name}</span>
                  <span className={cn("tabular ml-auto font-mono text-[10px]", m.capacity > 0 && m.assigned >= m.capacity ? "text-gold" : "text-dim")}>
                    {m.assigned}/{m.capacity || "—"}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.missionId && <p className="text-xs text-danger">{errors.missionId}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor={`team-${candidateId}`} className="text-sm font-semibold">
          Team
        </label>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger id={`team-${candidateId}`} className="h-10 w-full bg-bg" aria-invalid={!!errors.teamId}>
            <SelectValue placeholder="Choose a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex w-full items-center gap-3">
                  {t.name}
                  <span className={cn("tabular ml-auto font-mono text-[10px]", t.capacity > 0 && t.used >= t.capacity ? "text-gold" : "text-dim")}>
                    {t.used}/{t.capacity || "—"}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teamId && <p className="text-xs text-danger">{errors.teamId}</p>}
        {team && team.capacity > 0 && team.used >= team.capacity && (
          <p className="text-xs text-gold">{team.name} is full ({team.used}/{team.capacity}). You can still assign — it will be flagged.</p>
        )}
        {mission && mission.capacity > 0 && mission.assigned >= mission.capacity && (
          <p className="text-xs text-gold">{mission.name} is at capacity ({mission.assigned}/{mission.capacity}).</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`role-${candidateId}`} className="flex justify-between text-sm font-semibold">
          Role / sub-role <span className="font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-dim">Optional</span>
        </label>
        <Input id={`role-${candidateId}`} value={subRole} onChange={(e) => setSubRole(e.target.value)} placeholder="e.g. Setup & Infrastructure" className="h-10 bg-bg" maxLength={120} />
        {errors.subRole && <p className="text-xs text-danger">{errors.subRole}</p>}
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <Checkbox checked={isLead} onCheckedChange={(c) => setIsLead(c === true)} />
        Team leader for this team
      </label>

      <div className="space-y-2">
        <label htmlFor={`notes-${candidateId}`} className="flex justify-between text-sm font-semibold">
          Notes <span className="font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-dim">Optional</span>
        </label>
        <Textarea id={`notes-${candidateId}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-bg" maxLength={1000} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} {replace ? "Save reassignment" : "Save assignment"}
      </Button>
    </form>
  );
}
