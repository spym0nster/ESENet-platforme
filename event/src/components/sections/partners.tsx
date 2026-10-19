import Image, { type StaticImageData } from "next/image";
import ambassadors from "@/assets/brand/ambassadors.png";
import esen from "@/assets/brand/esen.png";
import ministere from "@/assets/brand/ministere.png";
import s2t from "@/assets/brand/s2t.png";
import tunisie from "@/assets/brand/tunisie.png";
import manouba from "@/assets/brand/universite-manouba.png";
import photoWall from "@/assets/media/photo-wall.jpg";
import type { Dictionary } from "@/content/i18n";
import { DataLine } from "../alchemy";
import { ButtonLink, Container, SectionLabel } from "../ui";

type Logo = { src: StaticImageData; alt: string; h: string };

const SUPPORT: Logo[] = [
  { src: tunisie, alt: "République Tunisienne", h: "h-14 sm:h-16" },
  { src: ministere, alt: "Ministère de l’Enseignement Supérieur et de la Recherche Scientifique", h: "h-12 sm:h-14" },
  { src: manouba, alt: "Université de la Manouba", h: "h-14 sm:h-16" },
  { src: s2t, alt: "S2T — Smart Tunisian Technoparks", h: "h-11 sm:h-14" },
];

const ORGANISERS: Logo[] = [
  { src: esen, alt: "ESEN — École Supérieure de l’Économie Numérique", h: "h-12 sm:h-14" },
  { src: ambassadors, alt: "ESEN Ambassadors", h: "h-14 sm:h-16" },
];

function LogoRow({ label, logos }: { label: string; logos: Logo[] }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-slate">{label}</p>
      <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6 sm:gap-x-14">
        {logos.map((logo) => (
          <li key={logo.alt}>
            <Image
              src={logo.src}
              alt={logo.alt}
              sizes="200px"
              className={`${logo.h} w-auto object-contain opacity-70 brightness-0 transition-opacity hover:opacity-100 dark:invert`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Partners({ t }: { t: Dictionary }) {
  const p = t.partners;

  return (
    <section id="partners" className="bg-white pb-24 lg:pb-32">
      <DataLine />
      <Container className="pt-24 lg:pt-32">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-8">
            <SectionLabel n="06" tone="light">
              {p.label}
            </SectionLabel>
            <h2 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl">
              {p.title}
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[17px] leading-relaxed text-slate">{p.intro}</p>
            <ButtonLink href="/esenet-2026-dossier-sponsoring.pdf" target="_blank" rel="noopener" className="mt-7">
              {t.cta.dossier}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-14 border-t border-ink/10 lg:mt-20" />

        <div className="grid gap-14 pt-14 lg:grid-cols-12 lg:gap-10 lg:pt-20">
          <div className="space-y-12 lg:col-span-5">
            <LogoRow label={p.organisedLabel} logos={ORGANISERS} />
            <LogoRow label={p.supportLabel} logos={SUPPORT} />
            <p className="border-t border-ink/10 pt-6 text-[15px] text-slate">{p.sponsorsSoon}</p>
          </div>
          <figure data-reveal className="lg:col-span-7">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-paper">
              <Image src={photoWall} alt={p.wallCaption} fill placeholder="blur" sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate">{p.wallCaption}</figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
