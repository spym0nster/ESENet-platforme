import Image, { type StaticImageData } from "next/image";
import ambassadors from "@/assets/brand/ambassadors.png";
import esen from "@/assets/brand/esen.png";
import ministere from "@/assets/brand/ministere.png";
import s2t from "@/assets/brand/s2t.png";
import tunisie from "@/assets/brand/tunisie.png";
import manouba from "@/assets/brand/universite-manouba.png";
import photoWall from "@/assets/media/photo-wall.jpg";
import { BENEFITS, EVENT, TIERS } from "@/content/event";
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
              className={`${logo.h} w-auto object-contain opacity-70 brightness-0 transition-opacity hover:opacity-100`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Partners({ t }: { t: Dictionary }) {
  const p = t.partners;
  const deckHref = `mailto:${EVENT.partnershipEmail}?subject=${encodeURIComponent(
    "ESENet 2026 — Dossier de partenariat / Partnership deck",
  )}`;

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
          <p className="text-[17px] leading-relaxed text-slate lg:col-span-4">{p.intro}</p>
        </div>

        <div className="mt-14 grid gap-4 lg:mt-20 lg:grid-cols-12">
          {/* Platinum is a different kind of deal (naming rights), so it gets
              its own block rather than a column in the table. */}
          <article data-reveal className="relative flex flex-col overflow-hidden rounded-2xl bg-navy p-7 text-snow sm:p-10 lg:col-span-5">
            <span aria-hidden className="bg-signature absolute inset-x-0 top-0 h-[3px]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-bright">{p.platinum.line}</p>
            <h3 className="mt-6 font-display text-6xl font-semibold tracking-[-0.03em] sm:text-7xl">{p.platinum.name}</h3>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-mist">{p.platinum.body}</p>
            <p className="mt-8 border-t border-white/10 pt-5 font-display text-2xl font-semibold tracking-tight text-snow/90">
              ESENet 2026 <span className="text-mist/60">by</span> <span className="text-signature whitespace-nowrap">{p.platinum.placeholder}</span>
            </p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-10">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist/70">{p.platinum.price}</span>
              <ButtonLink href={deckHref}>{t.cta.deck}</ButtonLink>
            </div>
          </article>

          <div data-reveal className="overflow-hidden rounded-2xl border border-ink/10 bg-white lg:col-span-7">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{p.benefitsLabel}</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-paper">
                  <th scope="col" className="px-4 py-5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-slate sm:p-6 sm:text-[11px] sm:tracking-[0.24em]">
                    {p.benefitsLabel}
                  </th>
                  {TIERS.map((tier) => (
                    <th
                      key={tier}
                      scope="col"
                      className="w-14 px-1 py-5 text-center font-display text-[13px] font-semibold tracking-tight text-ink sm:w-28 sm:p-6 sm:text-lg"
                    >
                      {p.tierNames[tier]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENEFITS.map((b) => (
                  <tr key={b.key} className="border-b border-ink/[0.07] last:border-b-0">
                    <th scope="row" className="px-4 py-4 text-[14px] font-normal leading-snug text-slate sm:px-6 sm:text-[15px]">
                      {p.benefits[b.key as keyof typeof p.benefits]}
                    </th>
                    {TIERS.map((tier) => (
                      <td key={tier} className="px-1 py-4 text-center sm:px-6">
                        {b.tiers.includes(tier) ? (
                          <span className="inline-block size-2.5 bg-green-deep" role="img" aria-label={p.included} />
                        ) : (
                          <span className="inline-block h-px w-3 bg-ink/20 align-middle" role="img" aria-label={p.notIncluded} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-b border-ink/10 pb-14 sm:flex-row sm:items-baseline sm:gap-8 lg:pb-20">
          <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.26em] text-slate">{p.extrasLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {p.extras.map((x) => (
              <li key={x} className="rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 text-[14px] text-ink/80">
                {x}
              </li>
            ))}
          </ul>
        </div>

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
