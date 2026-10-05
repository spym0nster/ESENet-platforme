import { ArrowLeft, Check, ExternalLink, FileText, Mail, Phone, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentControls, ContactFlag, NotesEditor, StatusActions } from "@/components/admin/candidate-controls";
import { CapacityBar, DemoTag, Panel, ScorePill, StatusBadge, Tag } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignMissionOptions, loadMatchMissions, loadTeamOptions, recommend } from "@/lib/services/matching";
import { getSettings } from "@/lib/services/settings";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Candidate" };

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const candidate = await db.candidate.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true }, orderBy: { skill: { sortOrder: "asc" } } },
      reviewedBy: { select: { name: true } },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: {
          mission: { select: { name: true } },
          team: { select: { name: true } },
          assignedBy: { select: { name: true } },
          endedBy: { select: { name: true } },
        },
      },
    },
  });
  if (!candidate) notFound();

  const assignmentIds = candidate.assignments.map((a) => a.id);
  const [missions, teams, settings, history] = await Promise.all([
    loadMatchMissions(),
    loadTeamOptions(),
    getSettings(),
    db.auditLog.findMany({
      where: {
        OR: [
          { targetType: "candidate", targetId: id },
          ...(assignmentIds.length ? [{ targetType: "assignment", targetId: { in: assignmentIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const recs = recommend(
    {
      skillIds: candidate.skills.map((s) => s.skillId),
      eventExperience: candidate.eventExperience,
      ambassadorExperience: candidate.ambassadorExperience,
    },
    missions,
  );
  const active = candidate.assignments.filter((a) => a.active);
  const past = candidate.assignments.filter((a) => !a.active);

  return (
    <div className="space-y-6">
      <Link href="/admin/candidates" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" /> Candidates
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-line pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm tracking-[0.08em] text-azure">{candidate.applicationId}</span>
            <StatusBadge status={candidate.status} />
            {candidate.isDemo && <DemoTag />}
          </div>
          <h1 className="mt-3 break-words font-display text-3xl font-extrabold uppercase [font-stretch:112%] sm:text-4xl">{candidate.fullName}</h1>
          <p className="mt-2 text-sm text-muted">
            {candidate.classYear} · {candidate.specialization} · Applied {formatDateTime(candidate.createdAt)}
            {candidate.reviewedBy && candidate.reviewedAt && <> · Last reviewed by {candidate.reviewedBy.name}</>}
          </p>
        </div>
        <StatusActions candidateId={candidate.id} name={candidate.fullName} status={candidate.status} assigned={active.length > 0} />
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Left column — the application */}
        <div className="space-y-6">
          <Panel title="Personal information">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info k="Email">
                <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-2 break-all hover:text-azure">
                  <Mail className="size-3.5 shrink-0 text-dim" /> {candidate.email}
                </a>
              </Info>
              <Info k="Phone">
                <a href={`tel:${candidate.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:text-azure">
                  <Phone className="size-3.5 text-dim" /> {candidate.phone}
                </a>
              </Info>
              <Info k="Class / year">{candidate.classYear}</Info>
              <Info k="Specialization">{candidate.specialization}</Info>
              <Info k="LinkedIn">{candidate.linkedin ? <ExtLink href={candidate.linkedin} /> : <span className="text-dim">—</span>}</Info>
              <Info k="Portfolio / Instagram">
                {candidate.portfolio ? (
                  candidate.portfolio.startsWith("@") ? candidate.portfolio : <ExtLink href={candidate.portfolio} />
                ) : (
                  <span className="text-dim">—</span>
                )}
              </Info>
              <Info k="CV">
                {candidate.cvUrl ? (
                  <a href={`/api/cv/${candidate.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-azure hover:underline">
                    <FileText className="size-4" /> View CV
                  </a>
                ) : (
                  <span className="text-dim">Not provided</span>
                )}
              </Info>
            </dl>
          </Panel>

          <Panel title="Availability">
            <div className="flex flex-wrap items-center gap-4">
              {["J-2", "J-1", "JOUR J"].map((d) => (
                <span key={d} className={cn("inline-flex items-center gap-2 font-mono text-sm tracking-[0.12em]", candidate.availabilityConfirmed ? "text-green" : "text-danger")}>
                  {candidate.availabilityConfirmed ? <Check className="size-4" /> : <X className="size-4" />} {d}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Confirmed the full operational period on {formatDateTime(candidate.consentAt)} (with consent to data use).
            </p>
          </Panel>

          <Panel title="Skills">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((s) => (
                <Tag key={s.skillId} className="text-text">
                  {s.skill.name}
                  {s.skill.isOther && candidate.otherSkill ? `: ${candidate.otherSkill}` : ""}
                </Tag>
              ))}
            </div>
          </Panel>

          <Panel title="Experience">
            <div className="space-y-5">
              <Answer q="Event organization before?" yes={candidate.eventExperience} details={candidate.eventExperienceDetails} />
              <Answer q="ESEN / ESEN Ambassadors / ESENet activities before?" yes={candidate.ambassadorExperience} details={candidate.ambassadorExperienceDetails} />
            </div>
          </Panel>

          <Panel title="Motivation">
            <div className="space-y-5">
              <div>
                <p className="eyebrow text-dim">What can you bring to the operational team?</p>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{candidate.whatCanYouBring}</p>
              </div>
              {candidate.additionalInformation && (
                <div>
                  <p className="eyebrow text-dim">Anything else</p>
                  <p className="mt-2 whitespace-pre-line leading-relaxed">{candidate.additionalInformation}</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Audit history" bodyClassName="p-0">
            {history.length === 0 ? (
              <p className="p-5 text-sm text-muted">No history yet.</p>
            ) : (
              <ol className="relative">
                {history.map((h) => (
                  <li key={h.id} className="relative flex gap-4 border-b border-line px-4 py-3 last:border-0 sm:px-5">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-azure/60" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm">{h.summary}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                        {h.user?.name ?? "Applicant"} · {h.action} · {formatDateTime(h.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* Right column — decisions */}
        <div className="space-y-6">
          <Panel title="Assignment" eyebrow="Mission · Team · Role" className={active.length ? "border-green/30" : undefined}>
            {active.length > 0 ? (
              <ul className="mb-4 space-y-3">
                {active.map((a) => (
                  <li key={a.id} className="border border-line bg-bg p-3">
                    <p className="font-display text-lg font-extrabold uppercase [font-stretch:112%]">{a.mission.name}</p>
                    <p className="text-sm text-muted">
                      {a.team.name}
                      {a.isLead && <span className="text-green"> · Team leader</span>}
                    </p>
                    {a.subRole && <p className="mt-1 text-sm">{a.subRole}</p>}
                    {a.notes && <p className="mt-1 whitespace-pre-line text-xs text-muted">{a.notes}</p>}
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                      By {a.assignedBy?.name ?? "—"} · {formatDateTime(a.createdAt)}
                      {a.scoreAtAssignment !== null && <> · Match {a.scoreAtAssignment}%</>}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              candidate.status === "SELECTED" && <p className="mb-4 text-sm text-gold">Selected — not assigned yet.</p>
            )}
            <AssignmentControls
              candidateId={candidate.id}
              candidateName={candidate.fullName}
              selected={candidate.status === "SELECTED"}
              active={active.map((a) => ({ id: a.id, missionName: a.mission.name, teamName: a.team.name, subRole: a.subRole, isLead: a.isLead, notes: a.notes }))}
              missions={assignMissionOptions(recs)}
              teams={teams}
              canAddMore={settings.allowMultipleAssignments}
              defaultMissionId={recs[0]?.score ? recs[0].missionId : undefined}
            />
            {past.length > 0 && (
              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-xs text-muted hover:text-text">Previous assignments ({past.length})</summary>
                <ul className="mt-3 space-y-2">
                  {past.map((a) => (
                    <li key={a.id} className="text-xs text-muted">
                      <span className="text-text">{a.mission.name}</span> / {a.team.name} · {formatDateTime(a.createdAt)} → {a.endedAt ? formatDateTime(a.endedAt) : "—"}
                      <span className="block text-dim">
                        {a.endReason ?? "Ended"}
                        {a.endedBy && ` by ${a.endedBy.name}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Panel>

          <Panel title="Recommended missions" eyebrow="Deterministic skill match — a suggestion, not a decision">
            <ol className="space-y-4">
              {recs.slice(0, 5).map((r, i) => (
                <li key={r.missionId} className={cn("space-y-2", i > 0 && "border-t border-line pt-4")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{r.missionName}</p>
                    <ScorePill score={r.score} />
                  </div>
                  <div className="h-1 bg-surface-3">
                    <div className="h-full bg-gradient-brand" style={{ width: `${r.score}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.matched.map((m) => (
                      <span key={m.skillId} className="inline-flex h-5 items-center gap-1 border border-green/40 px-1.5 text-[11px] text-green">
                        <Check className="size-3" /> {m.skillName}
                      </span>
                    ))}
                    {r.missing.slice(0, 3).map((m) => (
                      <span key={m.skillId} className="inline-flex h-5 items-center border border-line px-1.5 text-[11px] text-dim">
                        {m.skillName}
                      </span>
                    ))}
                  </div>
                  <CapacityBar used={r.assigned} capacity={r.capacity} label={<span className="text-xs text-muted">{r.teamName ?? "No default team"}</span>} />
                </li>
              ))}
              {recs.length === 0 && <p className="text-sm text-muted">No active missions configured.</p>}
            </ol>
            <p className="mt-4 text-[11px] leading-relaxed text-dim">
              Score = 85% weighted skill coverage (core skills count double; 60% coverage counts as a full fit) + 15% experience.
              See README → Skill matching.
            </p>
          </Panel>

          <Panel title="People to contact">
            <ContactFlag candidateId={candidate.id} reason={candidate.contactReason} />
          </Panel>

          <Panel title="Internal notes">
            <NotesEditor candidateId={candidate.id} initial={candidate.internalNotes ?? ""} />
          </Panel>

          <Button asChild variant="outline" className="w-full">
            <Link href={`/admin/assignments?candidate=${candidate.id}`}>Open in assignment workspace</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow text-dim">{k}</dt>
      <dd className="mt-1.5 text-sm">{children}</dd>
    </div>
  );
}

function ExtLink({ href }: { href: string }) {
  const safe = /^https?:\/\//i.test(href) ? href : undefined;
  if (!safe) return <span className="break-all">{href}</span>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1.5 break-all text-azure hover:underline">
      {href.replace(/^https?:\/\/(www\.)?/, "")} <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

function Answer({ q, yes, details }: { q: string; yes: boolean; details: string | null }) {
  return (
    <div>
      <p className="eyebrow text-dim">{q}</p>
      <p className={cn("mt-1.5 font-mono text-sm", yes ? "text-green" : "text-muted")}>{yes ? "Yes" : "No"}</p>
      {yes && details && <p className="mt-1 whitespace-pre-line leading-relaxed">{details}</p>}
    </div>
  );
}
