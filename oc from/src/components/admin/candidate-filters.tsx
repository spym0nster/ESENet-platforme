"use client";

import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Options = { classYears: string[]; specializations: string[]; skills: { id: string; name: string }[] };

const ALL = "__all";

export function CandidateFilters({ options }: { options: Options }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  function update(mut: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mut(next);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const setParam = (key: string, value: string) => update((p) => (value === ALL || !value ? p.delete(key) : p.set(key, value)));

  // Debounced search
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => setParam("q", q.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const skills = params.getAll("skill");
  const active = ["status", "classYear", "specialization", "assigned", "experience", "q", "demo"].some((k) => params.get(k)) || skills.length > 0;

  const sel = (key: string, placeholder: string, items: { value: string; label: string }[], width = "w-full sm:w-44") => (
    <Select value={params.get(key) ?? ALL} onValueChange={(v) => setParam(key, v)}>
      <SelectTrigger className={cn("h-9 bg-surface", width)} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, specialization, application ID…"
            className="h-9 bg-surface pl-9"
            aria-label="Search candidates"
          />
          {pending && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-dim" />}
        </div>
        {sel(
          "sort",
          "Newest first",
          [
            { value: "oldest", label: "Oldest first" },
            { value: "name", label: "Name A–Z" },
            { value: "status", label: "By status" },
          ],
          "w-full sm:w-40",
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {sel("status", "All statuses", STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] })))}
        {sel("classYear", "All classes", options.classYears.map((c) => ({ value: c, label: c })))}
        {sel("specialization", "All specializations", options.specializations.map((c) => ({ value: c, label: c })), "w-full sm:w-52")}
        {sel("assigned", "Assigned or not", [
          { value: "yes", label: "Assigned" },
          { value: "no", label: "Unassigned" },
        ])}
        {sel("experience", "Any experience", [
          { value: "event", label: "Has event experience" },
          { value: "esen", label: "Has ESEN experience" },
          { value: "any", label: "Either experience" },
          { value: "none", label: "No experience" },
        ], "w-full sm:w-48")}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 justify-between bg-surface font-normal sm:w-44">
              {skills.length ? `${skills.length} skill${skills.length > 1 ? "s" : ""}` : "Any skills"}
              <ChevronDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="start">
            <p className="px-2 py-1.5 text-xs text-muted">Candidates with all selected skills</p>
            <div className="max-h-72 overflow-y-auto">
              {options.skills.map((s) => {
                const on = skills.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      update((p) => {
                        const cur = p.getAll("skill").filter((x) => x !== s.id);
                        p.delete("skill");
                        (on ? cur : [...cur, s.id]).forEach((x) => p.append("skill", x));
                      })
                    }
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-surface-3"
                    aria-pressed={on}
                  >
                    <span className={cn("grid size-4 place-items-center border", on ? "border-azure bg-azure text-bg" : "border-line-strong")}>
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {active && (
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              setQ("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <X /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}
