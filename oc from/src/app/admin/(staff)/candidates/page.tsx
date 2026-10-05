import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddCandidateDialog } from "@/components/admin/add-candidate";
import { CandidateFilters } from "@/components/admin/candidate-filters";
import { Pagination } from "@/components/admin/pagination";
import { StatusMenu } from "@/components/admin/status-menu";
import { DemoTag, EmptyState, PageHeader, StatusBadge, Tag } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { candidateFilterOptions, listCandidates, parseCandidateFilters, type CandidateListRow } from "@/lib/services/candidates";
import { formatDate, shortClass } from "@/lib/utils";

export const metadata: Metadata = { title: "Candidates" };

type SP = Record<string, string | string[] | undefined>;

function exportHref(sp: SP) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v !== undefined && k !== "page") (Array.isArray(v) ? v : [v]).forEach((x) => p.append(k, x));
  }
  const qs = p.toString();
  return `/api/export/candidates${qs ? `?${qs}` : ""}`;
}

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const filters = parseCandidateFilters(sp);
  const [{ rows, total, pages }, options] = await Promise.all([listCandidates(filters), candidateFilterOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review"
        title="Candidates"
        description={`${total} application${total === 1 ? "" : "s"} match the current filters.`}
        actions={
          <>
            {user.role === "ADMIN" && (
              <Button asChild variant="outline" size="sm">
                <a href={exportHref(sp)}>
                  <Download /> Export CSV
                </a>
              </Button>
            )}
            <AddCandidateDialog skills={options.skills.filter((s) => s.name !== "Other")} />
          </>
        }
      />

      <Suspense>
        <CandidateFilters options={options} />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState title="No candidates match">Try removing a filter or searching for something else.</EmptyState>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto border border-line lg:block">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-navy-1">
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                  {["Name", "Class", "Specialization", "Skills", "Experience", "Status", "Assignment", "Team", "Created", "Actions"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-3 font-medium first:pl-4 last:pr-4 last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <Row key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet / mobile cards */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {rows.map((c) => (
              <Card key={c.id} c={c} />
            ))}
          </ul>

          <Pagination base="/admin/candidates" sp={sp} page={Math.min(filters.page, pages)} pages={pages} total={total} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  );
}

function SkillList({ c, max = 3 }: { c: CandidateListRow; max?: number }) {
  const names = c.skills.map((s) => s.skill.name);
  return (
    <div className="flex flex-wrap gap-1">
      {names.slice(0, max).map((n) => (
        <Tag key={n} className="h-5 px-1.5 text-[11px]">
          {n}
        </Tag>
      ))}
      {names.length > max && (
        <span className="text-[11px] text-dim" title={names.slice(max).join(", ")}>
          +{names.length - max}
        </span>
      )}
    </div>
  );
}

function Experience({ c }: { c: CandidateListRow }) {
  if (!c.eventExperience && !c.ambassadorExperience) return <span className="text-dim">—</span>;
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {c.eventExperience && <span>Events</span>}
      {c.ambassadorExperience && <span className="text-azure">ESEN</span>}
    </div>
  );
}

function Row({ c }: { c: CandidateListRow }) {
  const a = c.assignments[0];
  return (
    <tr className="group hover:bg-surface">
      <td className="max-w-56 px-3 py-3 pl-4">
        <Link href={`/admin/candidates/${c.id}`} className="font-medium hover:text-azure">
          {c.fullName}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-dim">
          {c.applicationId} {c.isDemo && <DemoTag />}
        </div>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-muted" title={c.classYear}>{shortClass(c.classYear)}</td>
      <td className="max-w-40 truncate px-3 py-3 text-xs" title={c.specialization}>
        {c.specialization}
      </td>
      <td className="max-w-64 px-3 py-3">
        <SkillList c={c} />
      </td>
      <td className="px-3 py-3">
        <Experience c={c} />
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={c.status} />
      </td>
      <td className="px-3 py-3 text-xs">
        {a ? (
          <>
            {a.mission.name}
            {a.subRole && <div className="text-dim">{a.subRole}</div>}
          </>
        ) : (
          <span className="text-dim">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-xs">
        {a ? (
          <>
            {a.team.name}
            {a.isLead && <span className="ml-1 text-green">· Lead</span>}
          </>
        ) : (
          <span className="text-dim">—</span>
        )}
      </td>
      <td className="tabular px-3 py-3 font-mono text-xs text-muted">{formatDate(c.createdAt)}</td>
      <td className="px-3 py-3 pr-4 text-right">
        <div className="flex justify-end gap-1.5">
          <StatusMenu candidateId={c.id} name={c.fullName} status={c.status} assigned={!!a} />
          <Button asChild variant="ghost" size="xs">
            <Link href={`/admin/candidates/${c.id}`}>Open</Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function Card({ c }: { c: CandidateListRow }) {
  const a = c.assignments[0];
  return (
    <li className="flex flex-col gap-3 border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/candidates/${c.id}`} className="block truncate font-semibold hover:text-azure">
            {c.fullName}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted">
            {c.classYear} · {c.specialization}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <SkillList c={c} max={4} />
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-xs">
        <span className="min-w-0 truncate">
          {a ? (
            <>
              {a.mission.name} · <span className="text-muted">{a.team.name}</span>
            </>
          ) : (
            <span className="text-dim">Unassigned</span>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {c.isDemo && <DemoTag />}
          <StatusMenu candidateId={c.id} name={c.fullName} status={c.status} assigned={!!a} />
        </div>
      </div>
    </li>
  );
}
