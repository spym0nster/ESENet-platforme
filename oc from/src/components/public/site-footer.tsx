import Link from "next/link";
import { AmbassadorsCrest } from "@/components/brand/logo";
import { EVENT } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-center lg:px-8">
        <AmbassadorsCrest className="h-14 w-auto" />
        <div className="space-y-1">
          <p className="text-sm text-text">
            {EVENT.name} — Operations Team
          </p>
          <p className="text-sm text-muted">
            Organised by{" "}
            <a href={EVENT.orgUrl} target="_blank" rel="noopener noreferrer" className="text-azure hover:underline">
              {EVENT.org}
            </a>{" "}
            · École Supérieure de l&apos;Économie Numérique, Manouba
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <Link href="/privacy" className="hover:text-text">Privacy</Link>
          <Link href="/apply" className="hover:text-text">Apply</Link>
          <Link href="/admin/login" className="hover:text-text">Staff</Link>
        </nav>
      </div>
    </footer>
  );
}
