"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDisclosure } from "@/components/use-disclosure";

type Item = { label: string; href: string };

/**
 * The header's section links as a bottom sheet, for signed-out visitors on a
 * phone (<640px). The signed-in equivalent lives inside AvatarMenu — same
 * sheet, one menu per person. Above 640px this renders nothing; the links
 * are inline in the bar.
 */
export function MobileNavMenu({ sections }: { sections: Item[] }) {
  const { open, setOpen, wrapRef, triggerRef, panelRef } = useDisclosure();
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div ref={wrapRef} className="relative sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
        className="flex items-center rounded-ctrl p-1 text-[color:var(--header-fg)] transition hover:text-white"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d={open ? "M5 5l10 10M15 5L5 15" : "M3 6h14M3 10h14M3 14h14"}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="menu"
            aria-label="Sections"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-card border border-border bg-surface pb-[env(safe-area-inset-bottom)] text-left normal-case tracking-normal [box-shadow:var(--lift)]"
          >
            <ul className="py-1">
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
            <div className="border-t border-border py-1">
              <Link
                href="/login"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-text transition hover:bg-surface-alt focus-visible:bg-surface-alt"
              >
                Log in
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
