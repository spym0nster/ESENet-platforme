import Image from "next/image";
import type { Dictionary } from "@/content/i18n";
import { EXHIBITORS_2025, type Exhibitor } from "@/content/past";
import { Container } from "../ui";

// "Ils ont fait confiance": the 2025 exhibitors and partners, after the
// logo band on bigtech.africa. Two rows drift in opposite directions and
// pause on hover; the strip fades out at both edges.
function LogoRow({ logos, reverse }: { logos: Exhibitor[]; reverse?: boolean }) {
  const cards = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
      {logos.map((x) => (
        <li
          key={x.name}
          className={`flex h-20 w-40 shrink-0 items-center justify-center rounded-xl border sm:h-24 sm:w-48 ${
            x.dark ? "border-navy bg-navy" : "border-ink/10 bg-white"
          }`}
        >
          <Image
            src={x.logo}
            alt={hidden ? "" : x.name}
            sizes="160px"
            className="h-auto max-h-[52%] w-auto max-w-[70%] object-contain"
          />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className={`flex w-max group-hover:[animation-play-state:paused] ${reverse ? "animate-marquee-reverse" : "animate-marquee-slow"}`}
      >
        {cards(false)}
        {cards(true)}
      </div>
    </div>
  );
}

export function Trusted({ t }: { t: Dictionary }) {
  const half = Math.ceil(EXHIBITORS_2025.length / 2);
  return (
    <section aria-labelledby="trusted-title" className="bg-paper py-20 lg:py-28">
      <Container className="text-center">
        <h2 id="trusted-title" className="font-display text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
          {t.trusted.titleA}{" "}
          <span className="bg-gradient-to-r from-blue via-teal to-green-deep bg-clip-text text-transparent">{t.trusted.titleB}</span>
        </h2>
        <span aria-hidden className="bg-signature mx-auto mt-5 block h-[3px] w-14 rounded-full" />
        <p className="mt-5 text-[17px] text-slate">{t.trusted.subtitle}</p>
      </Container>
      <div className="mt-12 space-y-3 sm:space-y-4">
        <LogoRow logos={EXHIBITORS_2025.slice(0, half)} />
        <LogoRow logos={EXHIBITORS_2025.slice(half)} reverse />
      </div>
      <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-slate">{t.trusted.note}</p>
    </section>
  );
}
