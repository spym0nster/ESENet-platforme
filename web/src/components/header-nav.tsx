"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { AvatarMenu } from "@/components/avatar-menu";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import type { AppNotification } from "@/types/database";

/**
 * The whole header nav in one client island — so the active-route state
 * (`usePathname`), the notification bell and the account menu share a
 * single client boundary.
 *
 * ≥640px: the section links sit inline in the bar (plus Dashboard for a
 * company, Admin for an admin), then the bell and the account menu; the
 * personal links and the only Log out live in the account menu.
 * <640px: the section links move into a bottom sheet — the account menu's
 * for a signed-in person, a hamburger sheet for a visitor — so the bar
 * stays one row: wordmark, bell, menu trigger.
 *
 * The current section gets full-contrast text and a solid cyan underline
 * (the gradient underline is reserved for the profile tabs — §8).
 */
const SECTIONS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/companies", label: "Companies" },
  { href: "/students", label: "Students" },
  { href: "/feed", label: "Feed" },
];

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-3 transition ${
        active
          ? "text-white after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent-2"
          : "text-[color:var(--header-fg)] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function HeaderNav({
  role,
  signedIn,
  unread,
  recent,
  displayName,
  email,
  avatarUrl,
  companyName,
}: {
  role: "student" | "company" | "admin" | null;
  signedIn: boolean;
  unread: number;
  recent: AppNotification[];
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  companyName: string | null;
}) {
  const sections = [...SECTIONS];
  if (role === "company")
    sections.push({ href: "/company/dashboard", label: "Dashboard" });
  if (role === "admin") sections.push({ href: "/admin", label: "Admin" });

  return (
    <nav className="flex items-center gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-wider">
      <div className="hidden items-center gap-x-6 sm:flex">
        {sections.map((s) => (
          <NavItem key={s.href} href={s.href}>
            {s.label}
          </NavItem>
        ))}
      </div>

      {signedIn && <NotificationBell unread={unread} recent={recent} />}

      {signedIn ? (
        <AvatarMenu
          role={role}
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          companyName={companyName}
          sections={sections}
        />
      ) : (
        <>
          <MobileNavMenu sections={sections} />
          <span className="flex items-center gap-2 sm:ml-2 sm:border-l sm:border-white/15 sm:pl-4">
            <Link
              href="/login"
              className="hidden min-h-9 items-center rounded-ctrl border border-border-strong px-4 font-sans text-xs font-semibold normal-case tracking-normal text-[color:var(--header-fg)] transition hover:border-white/40 hover:text-white active:translate-y-px sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-9 items-center rounded-ctrl bg-accent px-4 font-sans text-xs font-semibold normal-case tracking-normal text-white transition hover:brightness-105 active:translate-y-px"
            >
              Sign up
            </Link>
          </span>
        </>
      )}
    </nav>
  );
}
