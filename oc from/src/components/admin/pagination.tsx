import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SP = Record<string, string | string[] | undefined>;

function hrefFor(base: string, sp: SP, page: number) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || v === undefined) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => p.append(k, x));
  }
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export function Pagination({
  base,
  sp,
  page,
  pages,
  total,
  pageSize,
}: {
  base: string;
  sp: SP;
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "inline-flex h-8 items-center gap-1 border border-line-strong px-3 text-sm hover:bg-surface-2";
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row">
      <p className="tabular">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link className={btn} href={hrefFor(base, sp, page - 1)} rel="prev">
            <ChevronLeft className="size-4" /> Prev
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-40")}>
            <ChevronLeft className="size-4" /> Prev
          </span>
        )}
        <span className="tabular px-2 font-mono text-xs">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link className={btn} href={hrefFor(base, sp, page + 1)} rel="next">
            Next <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-40")}>
            Next <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
