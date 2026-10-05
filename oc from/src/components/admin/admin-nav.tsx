"use client";

import {
  CalendarClock,
  ClipboardList,
  Gauge,
  History,
  LogOut,
  Menu,
  Radio,
  Settings,
  Target,
  UserCircle,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/actions/auth";
import { EsenetLogo } from "@/components/brand/logo";
import { cn, initials } from "@/lib/utils";

type NavUser = { name: string; email: string; role: "ADMIN" | "AMBASSADOR" };

const NAV = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/missions", label: "Missions", icon: Target },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/admin/operations", label: "Operations", icon: Radio, accent: true },
] as const;

const ADMIN_NAV = [
  { href: "/admin/audit", label: "Audit log", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ user, onNavigate }: { user: NavUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const item = (n: { href: string; label: string; icon: typeof Gauge; exact?: boolean; accent?: boolean }) => {
    const active = isActive(n.href, n.exact);
    const Icon = n.icon;
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex h-9 items-center gap-3 px-3 text-sm transition-colors",
            active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/60 hover:text-text",
          )}
        >
          <span className={cn("absolute inset-y-1.5 left-0 w-0.5", active ? "bg-gradient-brand" : "bg-transparent")} aria-hidden />
          <Icon className={cn("size-4", n.accent && "text-green")} />
          {n.label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Staff navigation" className="flex flex-1 flex-col gap-6">
      <ul className="space-y-0.5">{NAV.map(item)}</ul>
      {user.role === "ADMIN" && (
        <div>
          <p className="eyebrow px-3 pb-2 text-dim">Admin</p>
          <ul className="space-y-0.5">{ADMIN_NAV.map(item)}</ul>
        </div>
      )}
      <div className="mt-auto border-t border-line pt-4">
        <Link href="/admin/account" onClick={onNavigate} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-2/60">
          <span className="grid size-8 shrink-0 place-items-center bg-surface-3 font-mono text-xs">{initials(user.name)}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm">{user.name}</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-dim">{user.role}</span>
          </span>
          <UserCircle className="ml-auto size-4 text-dim" />
        </Link>
        <form action={logout}>
          <button type="submit" className="mt-1 flex h-9 w-full items-center gap-3 px-3 text-sm text-muted hover:bg-surface-2/60 hover:text-text">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

export function AdminNav({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-navy-1 px-3 py-5 lg:flex">
        <Link href="/admin" className="mb-1 px-3">
          <EsenetLogo className="h-6" />
        </Link>
        <p className="eyebrow mb-6 px-3 text-dim">OC · Operations</p>
        <NavLinks user={user} />
      </aside>

      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-navy-1/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin">
          <EsenetLogo className="h-5" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center text-muted hover:text-text"
          aria-label="Open navigation"
          aria-expanded={open}
        >
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-black/60" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div key={pathname} className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-navy-1 px-3 py-4">
            <div className="mb-6 flex items-center justify-between px-3">
              <EsenetLogo className="h-5" />
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center text-muted" aria-label="Close navigation">
                <X className="size-5" />
              </button>
            </div>
            <NavLinks user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
