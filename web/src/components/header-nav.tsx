"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { signOut } from "@/app/actions/auth";
import type { AppNotification } from "@/types/database";

/**
 * The whole header nav in one client island — so the active-route state
 * (`usePathname`) and the notification bell share a single client
 * boundary instead of scattering many across the async SiteHeader.
 *
 * The current section gets full-contrast text and a solid cyan underline
 * (the gradient underline is reserved for the profile tabs — §8).
 */
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
}: {
  role: "student" | "company" | "admin" | null;
  signedIn: boolean;
  unread: number;
  recent: AppNotification[];
}) {
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-wider">
      <NavItem href="/opportunities">Opportunities</NavItem>
      <NavItem href="/companies">Companies</NavItem>
      <NavItem href="/students">Students</NavItem>
      <NavItem href="/feed">Feed</NavItem>

      {role === "student" && (
        <>
          <NavItem href="/profile">My profile</NavItem>
          <NavItem href="/applications">My applications</NavItem>
          <NavItem href="/saved">Saved</NavItem>
        </>
      )}
      {role === "company" && (
        <>
          <NavItem href="/company/profile">My profile</NavItem>
          <NavItem href="/company/dashboard">My company</NavItem>
        </>
      )}
      {role === "admin" && (
        <>
          <NavItem href="/admin">Admin</NavItem>
          <NavItem href="/admin/reports">Reports</NavItem>
        </>
      )}

      {signedIn && <NotificationBell unread={unread} recent={recent} />}

      {signedIn ? (
        <form action={signOut}>
          <button
            type="submit"
            className="py-3 text-[color:var(--header-fg)] transition hover:text-white"
          >
            Sign out
          </button>
        </form>
      ) : (
        <span className="flex items-center gap-2 sm:ml-2 sm:border-l sm:border-white/15 sm:pl-4">
          <Link
            href="/login"
            className="inline-flex min-h-9 items-center rounded-ctrl border border-border-strong px-4 font-sans text-xs font-semibold normal-case tracking-normal text-[color:var(--header-fg)] transition hover:border-white/40 hover:text-white active:translate-y-px"
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
      )}
    </nav>
  );
}
