import Image from "next/image";
import Link from "next/link";
import arrival from "@/assets/media/arrival.jpg";
import audience from "@/assets/media/audience.jpg";
import guests from "@/assets/media/guests.jpg";
import photographers from "@/assets/media/photographers.jpg";
import { EVENT, NUMBERS } from "@/content/event";
import type { Dictionary, Locale } from "@/content/i18n";
import { CountUp } from "../count-up";
import { Arrow, Container, Glyph, SectionLabel } from "../ui";

export function Ticker({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-8 pr-8 sm:gap-10 sm:pr-10">
          <span>{item}</span>
          <Glyph kind={(i % 3) as 0 | 1 | 2} />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden border-b border-white/10 bg-night py-5 sm:py-6">
      <div className="animate-marquee flex w-max font-display text-xl font-semibold uppercase tracking-[-0.01em] text-snow/90 sm:text-2xl">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

// Hairlines between cells for a 2 → 3 → 5 column grid, set once per
// breakpoint so no two utilities fight over the same property.
function cellBorders(i: number) {
  const c: string[] = [];
  const left = i % 2 === 1;
  const top = i >= 2;
  if (left) c.push("border-l pl-4");
  if (top) c.push("border-t");
  const smLeft = i % 3 !== 0;
  const smTop = i >= 3;
  if (smLeft !== left) c.push(smLeft ? "sm:border-l sm:pl-6" : "sm:border-l-0 sm:pl-0");
  else if (smLeft) c.push("sm:pl-6");
  if (smTop !== top) c.push(smTop ? "sm:border-t" : "sm:border-t-0");
  const lgLeft = i > 0;
  if (lgLeft !== smLeft) c.push(lgLeft ? "lg:border-l lg:pl-8" : "lg:border-l-0 lg:pl-0");
  else if (lgLeft) c.push("lg:pl-8");
  if (smTop) c.push("lg:border-t-0");
  return c.join(" ");
}

export function Numbers({ t }: { t: Dictionary }) {
  return (
    <section aria-label={t.numbers.label} className="bg-navy">
      <Container>
        <div className="flex items-center justify-between border-b border-white/10 py-5 font-mono text-[11px] uppercase tracking-[0.28em] text-mist/70">
          <span>{t.numbers.label}</span>
          <span>25.11.2026</span>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {NUMBERS.map((n, i) => (
            <div
              key={n.key}
              data-reveal
              style={{ transitionDelay: `${i * 70}ms` }}
              className={`flex flex-col-reverse justify-end border-white/10 py-8 pr-4 lg:py-14 ${cellBorders(i)}`}
            >
              <dt className="mt-3 max-w-[16ch] text-[14px] leading-snug text-mist">{t.numbers.items[n.key]}</dt>
              <dd className="font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl xl:text-7xl">
                <CountUp value={n.value} suffix={n.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export function Edition({ t, lang }: { t: Dictionary; lang: Locale }) {
  const e = t.edition;
  const accents = ["bg-blue-light", "bg-cyan", "bg-green"];
  return (
    <section className="border-t border-white/10 bg-navy py-24 lg:py-36">
      <Container>
        <SectionLabel n="01">{e.label}</SectionLabel>
        <p
          data-reveal
          className="mt-10 max-w-6xl font-display text-[clamp(2rem,4.4vw,4.25rem)] font-bold leading-[1.04] tracking-[-0.035em]"
        >
          <span className="text-mist/55">{e.statementA}</span> {e.statementB}{" "}
          <span className="text-signature">{e.statementHighlight}</span>
          {lang === "fr" ? " ?" : "?"}
        </p>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-16">
          <figure data-reveal className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink">
              <Image
                src={audience}
                alt={e.caption}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mist/60">{e.caption}</figcaption>
          </figure>

          <div className="lg:col-span-5">
            <p data-reveal className="text-[17px] leading-[1.7] text-mist">
              {e.body}
            </p>
            <ol className="mt-10">
              {e.steps.map((step, i) => (
                <li
                  key={step.word}
                  data-reveal
                  style={{ transitionDelay: `${i * 90}ms` }}
                  className="relative grid grid-cols-[3rem_1fr] border-t border-white/10 py-7"
                >
                  <span aria-hidden className={`absolute left-0 top-[-1px] h-px w-12 ${accents[i]}`} />
                  <span className="pt-2.5">
                    <Glyph kind={i as 0 | 1 | 2} />
                  </span>
                  <div>
                    <p className="flex items-baseline justify-between gap-4">
                      <span className="font-display text-3xl font-bold tracking-tight">{step.word}</span>
                      <span className="font-mono text-[11px] tracking-[0.2em] text-mist/60">0{i + 1}</span>
                    </p>
                    <p className="mt-2 font-semibold">{step.title}</p>
                    <p className="text-mist">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Paths({ t, lang }: { t: Dictionary; lang: Locale }) {
  const p = t.paths;
  const pressMail = `mailto:${EVENT.partnershipEmail}?subject=${encodeURIComponent("ESENet 2026 — Presse / Press")}`;
  const cards = [
    { image: arrival, href: `/${lang}/register`, position: "object-[50%_40%]" },
    { image: guests, href: `/${lang}#partners`, position: "object-[22%_50%]" },
    { image: photographers, href: pressMail, position: "object-[30%_50%]" },
  ];
  return (
    <section className="border-t border-white/10 bg-navy pb-24 pt-20 lg:pb-36 lg:pt-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel n="02">{p.label}</SectionLabel>
            <h2 className="mt-6 font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">{p.title}</h2>
          </div>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16">
          {p.items.map((item, i) => (
            <Link
              key={item.title}
              href={cards[i].href}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-sm bg-ink p-6 sm:p-8 md:aspect-[3/4]"
            >
              <Image
                src={cards[i].image}
                alt=""
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 33vw, 100vw"
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${cards[i].position}`}
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/10" />
              <span className="absolute left-6 top-6 font-mono text-[11px] tracking-[0.2em] text-snow/80 sm:left-8 sm:top-8">
                0{i + 1}
              </span>
              <div className="relative">
                <h3 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-mist">{item.body}</p>
                <p className="mt-6 inline-flex items-center gap-2 border-b border-white/30 pb-1 text-[15px] font-semibold transition-colors group-hover:border-green group-hover:text-green">
                  {item.cta}
                  <Arrow className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
