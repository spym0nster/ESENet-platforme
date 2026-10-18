import Image from "next/image";
import awards from "@/assets/media/awards.jpg";
import courtyard from "@/assets/media/courtyard.jpg";
import crew from "@/assets/media/crew.jpg";
import odyssee from "@/assets/media/odyssee.jpg";
import openingFlag from "@/assets/media/opening-flag.jpg";
import teamArch from "@/assets/media/team-arch.jpg";
import { EVENT } from "@/content/event";
import type { Dictionary } from "@/content/i18n";
import { DataLine } from "../alchemy";
import { ButtonLink, Container, Glyph, SectionLabel } from "../ui";

export function History({ t }: { t: Dictionary }) {
  const h = t.history;
  const last = h.items.length - 1;
  // Real photographs from past editions (the team's Drive and esenet-tn.com),
  // captioned like a magazine.
  const gallery = [
    { src: openingFlag, caption: h.gallery.opening, span: "lg:col-span-7", ratio: "aspect-[4/3]" },
    { src: teamArch, caption: h.gallery.team, span: "lg:col-span-5", ratio: "aspect-[4/3] lg:aspect-auto lg:h-full" },
    { src: awards, caption: h.gallery.awards, span: "lg:col-span-5", ratio: "aspect-[4/3]" },
    { src: odyssee, caption: h.gallery.odyssee, span: "lg:col-span-7", ratio: "aspect-[16/9] lg:aspect-auto lg:h-full" },
  ];
  return (
    <section className="bg-paper pb-24 lg:pb-32">
      <DataLine />
      <Container className="pt-24 lg:pt-32">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel n="07" tone="light">
              {h.label}
            </SectionLabel>
            <h2 className="mt-6 max-w-4xl font-display text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">
              {h.title}
            </h2>
          </div>
          <ButtonLink href={EVENT.aftermovieUrl} variant="outline" target="_blank" rel="noopener" className="self-start lg:self-auto">
            {h.aftermovie}
          </ButtonLink>
        </div>

        <ol className="mt-14 grid gap-0 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {h.items.map((item, i) => (
            <li
              key={item.title}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="relative border-t border-ink/15 py-8 sm:pr-8"
            >
              {i === last && <span aria-hidden className="bg-signature absolute inset-x-0 top-[-1px] h-[3px]" />}
              <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
                <Glyph kind={(i === last ? 2 : i === 0 ? 0 : 1) as 0 | 1 | 2} />
                {item.edition}
                {i === last && <span className="rounded-full bg-green px-2 py-px leading-4 text-night">{h.now}</span>}
              </p>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">{item.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-slate">{item.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
          {gallery.map((img, i) => (
            <figure key={img.caption} data-reveal style={{ transitionDelay: `${(i % 2) * 90}ms` }} className={`flex flex-col ${img.span}`}>
              <div className={`relative overflow-hidden rounded-2xl bg-white ${img.ratio} lg:flex-1`}>
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate">{img.caption}</figcaption>
            </figure>
          ))}
        </div>

        {/* behind the scenes: the crew that builds the day */}
        <figure data-reveal className="mt-4 grid items-center gap-6 overflow-hidden rounded-2xl bg-navy text-snow lg:grid-cols-12">
          <div className="relative aspect-[16/9] lg:col-span-7 lg:aspect-[16/8]">
            <Image src={crew} alt={h.gallery.crew} fill placeholder="blur" sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="px-7 pb-8 lg:col-span-5 lg:px-4 lg:pb-0 lg:pr-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-bright">{h.crewLabel}</p>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{h.crewBody}</p>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}

export function Venue({ t }: { t: Dictionary }) {
  const v = t.venue;
  return (
    <section id="venue" className="bg-white py-24 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure data-reveal className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper">
            <Image src={courtyard} alt={v.caption} fill placeholder="blur" sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate">{v.caption}</figcaption>
        </figure>

        <div className="flex flex-col lg:col-span-5">
          <SectionLabel n="08" tone="light">
            {v.label}
          </SectionLabel>
          <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">{v.title}</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-slate">{v.body}</p>
          <dl className="mt-10">
            {v.details.map((d) => (
              <div key={d.k} className="grid grid-cols-[6.5rem_1fr] gap-4 border-t border-ink/10 py-4">
                <dt className="pt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate">{d.k}</dt>
                <dd className="text-[16px] font-medium text-ink">{d.v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <ButtonLink href={EVENT.mapsUrl} variant="outline" target="_blank" rel="noopener">
              {t.cta.map}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
