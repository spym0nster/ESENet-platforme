import Link from "next/link";
import { AmbassadorsCrest, EsenetLogo } from "@/components/brand/logo";
import { HeaderCta } from "@/components/public/header-cta";

export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="ESENet OC — home">
          <EsenetLogo className="h-6 sm:h-7" priority />
          <span className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden />
          <span className="eyebrow hidden sm:block">OC · Operations</span>
        </Link>
        <div className="flex items-center gap-3">
          <a href="https://ambassadors.tn" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 md:flex" aria-label="ESEN Ambassadors (opens in a new tab)">
            <AmbassadorsCrest className="h-8 w-auto opacity-90" />
          </a>
          {cta && <HeaderCta />}
        </div>
      </div>
    </header>
  );
}
