import Image from "next/image";

/**
 * The official ESENet wordmark (public/logo.png). Its "ESE" and "Talent
 * Fair" glyphs are near-white, so it only reads correctly on a dark
 * ground — always render it inside a dark surface (see SiteHeader), never
 * directly on a page that can go light.
 */
export function Logo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="ESENet"
      width={4440}
      height={851}
      priority
      className={className}
    />
  );
}
