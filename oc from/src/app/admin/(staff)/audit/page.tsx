import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

const TYPES = ["candidate", "assignment", "mission", "team", "schedule", "note", "user", "settings", "skill", "export"] as const;
const PER_PAGE = 50;

function Json({ value }: { value: Prisma.JsonValue | null }) {
  if (value === null || value === undefined) return <span className="text-dim">—</span>;
  return <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-muted">{JSON.stringify(value, null, 1)}</pre>;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const type = TYPES.find((t) => t === sp.type);
  const page = Math.max(1, Math.min(10_000, Number(sp.page) || 1));
  const where: Prisma.AuditLogWhereInput = type ? { targetType: type } : {};

  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { user: { select: { name: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Accountability" title="Audit log" description="Every review, status change, assignment, configuration change and export — who, what, when, before and after." />

      <nav aria-label="Filter by type" className="flex flex-wrap gap-1.5">
        <Link href="/admin/audit" className={cn("border px-3 py-1 text-xs", !type ? "border-azure text-text" : "border-line-strong text-muted hover:text-text")}>All</Link>
        {TYPES.map((t) => (
          <Link key={t} href={`/admin/audit?type=${t}`} className={cn("border px-3 py-1 text-xs capitalize", type === t ? "border-azure text-text" : "border-line-strong text-muted hover:text-text")}>
            {t}
          </Link>
        ))}
      </nav>

      {logs.length === 0 ? (
        <EmptyState title="No entries" />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-navy-1">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-3 py-3 font-medium">Who</th>
                <th className="px-3 py-3 font-medium">Action</th>
                <th className="px-3 py-3 font-medium">Summary</th>
                <th className="px-3 py-3 font-medium">Previous</th>
                <th className="px-4 py-3 font-medium">New</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-surface">
                  <td className="tabular whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{formatDateTime(l.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{l.user?.name ?? <span className="text-dim">Public form</span>}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-azure">{l.action}</td>
                  <td className="max-w-80 px-3 py-3">
                    {l.targetType === "candidate" && l.targetId ? (
                      <Link href={`/admin/candidates/${l.targetId}`} className="hover:text-azure">{l.summary}</Link>
                    ) : (
                      l.summary
                    )}
                  </td>
                  <td className="max-w-64 px-3 py-3"><Json value={l.previous} /></td>
                  <td className="max-w-64 px-4 py-3"><Json value={l.next} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination base="/admin/audit" sp={type ? { type } : {}} page={Math.min(page, pages)} pages={pages} total={total} pageSize={PER_PAGE} />
    </div>
  );
}
