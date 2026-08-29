"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A header nav link that knows whether it's the current section. Active
 * gets full-contrast text and a solid cyan underline (the *tab* underline
 * is the gradient one — §8 — this global-nav one is not).
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
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
