"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/** "Join the team" — hidden while the visitor is already in the application flow. */
export function HeaderCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/apply") || pathname.startsWith("/application")) return null;
  return (
    <Button asChild size="sm">
      <Link href="/apply">Join the team</Link>
    </Button>
  );
}
