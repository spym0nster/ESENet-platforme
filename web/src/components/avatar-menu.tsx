"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui";
import { signOut } from "@/app/actions/auth";
import { useDisclosure } from "@/components/use-disclosure";

type Role = "student" | "company" | "admin";
type Item = { label: string; href: string };

/**
 * The account menu in the header — everything that used to be scattered as
 * mono links in the bar (My profile, Saved, applications…) plus the only
 * copy of Log out. Click to open (never hover — §7).
 *
 * Desktop: a dropdown of account items only (the section links live in the
 * bar). Below 640px: one bottom sheet that also carries the section links,
 * so a phone has a single menu, not a nav row that wraps plus a separate
 * account dropdown.
 */
const MENU: Record<Role, Item[]> = {
  student: [
    { label: "My profile", href: "/profile" },
    { label: "Saved", href: "/saved" },
    { label: "My applications", href: "/applications" },
    { label: "Notifications", href: "/notifications" },
  ],
  company: [
    { label: "Company profile", href: "/company/profile" },
    { label: "Team", href: "/company/team" },
    { label: "Notifications", href: "/notifications" },
  ],
  admin: [
    { label: "Admin", href: "/admin" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Notifications", href: "/notifications" },
  ],
};

export function AvatarMenu({
  role,
  displayName,
  email,
  avatarUrl,
  companyName,
  sections,
}: {
  role: Role | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  /** the header's section links — rendered in the mobile sheet only */
  sections: Item[];
}) {
  const { open, setOpen, wrapRef, triggerRef, panelRef } = useDisclosure();
  const pathname = usePathname();

  const name =
    role === "company"
      ? companyName ?? displayName ?? "Your company"
      : displayName ?? "Your account";
  const items = role ? MENU[role] : [];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-1.5 rounded-ctrl p-0.5 text-[color:var(--header-fg)] transition hover:text-white"
      >
        <Avatar name={name} src={avatarUrl} size="sm" />
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`transition ${open ? "rotate-180" : ""} motion-reduce:transition-none`}
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="menu"
            aria-label="Account"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-card border border-border bg-surface pb-[env(safe-area-inset-bottom)] text-left normal-case tracking-normal [box-shadow:var(--lift)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:w-64 sm:rounded-card"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate font-display text-sm font-semibold text-text">
                {name}
              </p>
              {email && (
                <p className="truncate font-mono text-xs text-text-faint">
                  {email}
                </p>
              )}
            </div>

            {/* section links — phone only; on desktop they're in the bar */}
            <ul className="border-b border-border py-1 sm:hidden">
              {sections.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    role="menuitem"
                    aria-current={isActive(s.href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-2.5 text-sm transition hover:bg-surface-alt focus-visible:bg-surface-alt ${
                      isActive(s.href)
                        ? "font-semibold text-text"
                        : "text-text-muted hover:text-text focus-visible:text-text"
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>

            {items.length > 0 && (
              <ul className="py-1">
                {items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface-alt hover:text-text focus-visible:bg-surface-alt focus-visible:text-text"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border py-1">
              <form action={signOut}>
                <button
                  type="submit"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-magenta transition hover:bg-surface-alt focus-visible:bg-surface-alt"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
