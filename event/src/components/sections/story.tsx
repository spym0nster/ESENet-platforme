import Image from "next/image";
import courtyard from "@/assets/media/courtyard.jpg";
import group from "@/assets/media/edition-7.jpg";
import opening from "@/assets/media/opening.jpg";
import crew from "@/assets/media/crew.jpg";
import networking from "@/assets/media/networking.jpg";
import { EVENT } from "@/content/event";
import type { Dictionary } from "@/content/i18n";
import { ButtonLink, Container, Glyph, SectionLabel } from "../ui";

export function History({ t }: { t: Dictionary }) {
  const h = t.history;
  const last = h.items.length - 1;
  return (
    <section className="border-t border-white/10 bg-night py-24 lg:py-36">
      <Container>
        <SectionLabel n="07">{h.label}</SectionLabel>
        <h2 className="mt-6 max-w-4xl font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">{h.title}</h2>

        <ol className="mt-14 grid gap-0 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {h.items.map((item, i) => (
            <li
              key={item.title}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="relative border-t border-white/15 py-8 sm:pr-8"
            >
              {i === last && <span aria-hidden className="bg-signature absolute inset-x-0 top-[-1px] h-[2px]" />}
              <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-mist/70">
                <Glyph kind={(i === last ? 2 : i === 0 ? 0 : 1) as 0 | 1 | 2} />
                {item.edition}
                {i === last && <span className="rounded-full bg-green px-2 py-px leading-4 text-night">{h.now}</span>}
              </p>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{item.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-mist">{item.body}</p>
            </li>
          ))}
        </ol>

        {/* Real photographs from past editions, captioned like a magazine. */}
        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
          {[
            { src: opening, caption: h.gallery.opening, span: "lg:col-span-7", ratio: "aspect-[4/3]" },
            { src: networking, caption: h.gallery.networking, span: "lg:col-span-5", ratio: "aspect-[4/3] lg:aspect-auto lg:h-full" },
            { src: group, caption: h.gallery.group, span: "lg:col-span-5", ratio: "aspect-[3/2]" },
            { src: crew, caption: h.gallery.crew, span: "lg:col-span-7", ratio: "aspect-[3/2] lg:aspect-auto lg:h-full" },
          ].map((img, i) => (
            <figure key={img.caption} data-reveal style={{ transitionDelay: `${(i % 2) * 90}ms` }} className={`flex flex-col ${img.span}`}>
              <div className={`relative overflow-hidden rounded-sm bg-ink ${img.ratio} lg:flex-1`}>
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mist/60">{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function Venue({ t }: { t: Dictionary }) {
  const v = t.venue;
  return (
    <section id="venue" className="bg-navy py-24 lg:py-36">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure data-reveal className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink">
            <Image src={courtyard} alt={v.caption} fill placeholder="blur" sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mist/60">{v.caption}</figcaption>
        </figure>

        <div className="flex flex-col lg:col-span-5">
          <SectionLabel n="08">{v.label}</SectionLabel>
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-5xl">{v.title}</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-mist">{v.body}</p>
          <dl className="mt-10">
            {v.details.map((d) => (
              <div key={d.k} className="grid grid-cols-[6.5rem_1fr] gap-4 border-t border-white/10 py-4">
                <dt className="pt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-mist/60">{d.k}</dt>
                <dd className="text-[16px] font-medium">{d.v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <ButtonLink href={EVENT.mapsUrl} variant="ghost" target="_blank" rel="noopener">
              {t.cta.map}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
