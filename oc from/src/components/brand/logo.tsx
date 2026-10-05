import Image from "next/image";
import { cn } from "@/lib/utils";

/** Official ESENet Talent Fair wordmark (2026 identity). Dark grounds only — the "ESE" glyphs are near-white. */
export function EsenetLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/esenet-logo.png"
      alt="ESENet Talent Fair"
      width={1400}
      height={271}
      priority={priority}
      className={cn("h-auto w-auto select-none", className)}
    />
  );
}

/** Official ESEN Ambassadors crest. White on transparent — dark grounds only. */
export function AmbassadorsCrest({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/esen-ambassadors.png"
      alt="ESEN Ambassadors"
      width={558}
      height={600}
      className={cn("h-auto select-none", className)}
    />
  );
}
