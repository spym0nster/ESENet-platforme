import Image from "next/image";
import Link from "next/link";
import knot from "@/assets/media/alchemy-knot.jpg";
import audience from "@/assets/media/audience.jpg";
import checkin from "@/assets/media/checkin.jpg";
import networkingStands from "@/assets/media/networking-stands.jpg";
import photographers from "@/assets/media/photographers.jpg";
import { EVENT, NUMBERS } from "@/content/event";
import type { Dictionary, Locale } from "@/content/i18n";
import { NodeRule } from "../alchemy";
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
    <div className="overflow-hidden border-b border-ink/10 bg-paper py-5 sm:py-6">
      <div className="animate-marquee flex w-max font-display text-xl font-semibold uppercase tracking-[-0.01em] text-ink sm:text-2xl">
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

const NUMBER_COLORS = ["text-blue", "text-blue", "text-teal", "text-teal", "text-green-deep"];

export function Numbers({ t }: { t: Dictionary }) {
  return (
    <section aria-label={t.numbers.label} className="bg-white">
      <Container>
        <div className="flex items-center justify-between border-b border-ink/10 py-5 font-mono text-[11px] uppercase tracking-[0.28em] text-slate">
          <span>{t.numbers.label}</span>
          <span>25.11.2026</span>
        </div>
        <dl className="relative isolate grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {/* the brand molecule: blue points → cyan rings → green squares */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[url('/brand/molecule.svg')] bg-[length:140%_auto] bg-[position:50%_48%] bg-no-repeat opacity-25 lg:bg-[length:110%_auto]"
          />
          {NUMBERS.map((n, i) => (
            <div
              key={n.key}
              data-reveal
              style={{ transitionDelay: `${i * 70}ms` }}
              className={`flex flex-col-reverse justify-end border-ink/10 py-8 pr-4 lg:py-14 ${cellBorders(i)}`}
            >
              <dt className="mt-3 max-w-[16ch] text-[14px] leading-snug text-slate">{t.numbers.items[n.key]}</dt>
              <dd className={`font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl xl:text-7xl ${NUMBER_COLORS[i]}`}>
                <CountUp value={n.value} suffix={n.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

// The brand kit's alchemy knot is the Data → Intelligence → Value idea drawn
// literally: raw blue strands on the left, the knot that makes sense of them,
// a single green point of value on the right. It sits in a navy panel (the
// artwork is navy) and the three steps line up under the part they name.
const KNOT_LABELS = [
  { left: "14%", top: "16%", kind: 0 as const, color: "text-blue-light" },
  { left: "50%", top: "9%", kind: 1 as const, color: "text-cyan" },
  { left: "92%", top: "44%", kind: 2 as const, color: "text-green" },
];

export function Edition({ t, lang }: { t: Dictionary; lang: Locale }) {
  const e = t.edition;
  const accents = ["bg-blue", "bg-teal", "bg-green-deep"];
  const words = ["text-blue", "text-teal", "text-green-deep"];
  return (
    <section className="bg-white pb-24 lg:pb-36">
      <NodeRule />
      <Container className="pt-24 lg:pt-32">
        <SectionLabel n="01" tone="light">
          {e.label}
        </SectionLabel>
        <p
          data-reveal
          className="mt-10 max-w-6xl font-display text-[clamp(2rem,4.4vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink"
        >
          <span className="text-slate/70">{e.statementA}</span> {e.statementB}{" "}
          <span className="bg-gradient-to-r from-blue via-teal to-green-deep bg-clip-text text-transparent">
            {e.statementHighlight}
          </span>
          {lang === "fr" ? " ?" : "?"}
        </p>

        <div className="mt-16 lg:mt-24">
          <div data-reveal className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-navy sm:aspect-[2.46/1]">
            <Image src={knot} alt="" fill placeholder="blur" sizes="100vw" className="object-cover object-[50%_60%]" />
            {KNOT_LABELS.map((l, i) => (
              <span
                key={i}
                aria-hidden
                className={`absolute hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.28em] sm:flex ${l.color}`}
                style={{ left: l.left, top: l.top }}
              >
                <Glyph kind={l.kind} />
                {e.steps[i].word}
              </span>
            ))}
          </div>

          <ol className="mt-2 grid sm:grid-cols-3">
            {e.steps.map((step, i) => (
              <li
                key={step.word}
                data-reveal
                style={{ transitionDelay: `${i * 90}ms` }}
                className={`relative py-8 sm:pr-8 ${i > 0 ? "border-t border-ink/10 sm:border-l sm:border-t-0 sm:pl-8" : ""}`}
              >
                <span aria-hidden className={`absolute top-0 h-[2px] w-14 ${i > 0 ? "left-0 sm:left-8" : "left-0"} ${accents[i]}`} />
                <p className="flex items-baseline justify-between gap-4 font-mono text-[11px] tracking-[0.2em] text-slate">
                  <span className="flex items-center gap-2">
                    <Glyph kind={i as 0 | 1 | 2} />0{i + 1}
                  </span>
                  <span>{step.title}</span>
                </p>
                <p className={`mt-5 font-display text-4xl font-semibold tracking-tight lg:text-5xl ${words[i]}`}>{step.word}</p>
                <p className="mt-2 text-slate">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <figure data-reveal className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper">
              <Image
                src={audience}
                alt={e.caption}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate">{e.caption}</figcaption>
          </figure>
          <div className="flex flex-col justify-center lg:col-span-5">
            <p data-reveal className="text-[17px] leading-[1.7] text-slate">
              {e.body}
            </p>
            <p data-reveal className="mt-8 font-display text-3xl font-semibold tracking-tight text-ink">
              {e.alchemist}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Paths({ t, lang }: { t: Dictionary; lang: Locale }) {
  const p = t.paths;
  const pressMail = `mailto:${EVENT.contactEmail}?subject=${encodeURIComponent("ESENet 2026 — Presse / Press")}`;
  const cards = [
    { image: checkin, href: `/${lang}/register`, position: "object-[50%_45%]" },
    { image: networkingStands, href: `/${lang}/exhibit`, position: "object-[50%_40%]" },
    { image: photographers, href: pressMail, position: "object-[30%_50%]" },
  ];
  return (
    <section className="bg-paper py-24 lg:py-32">
      <Container>
        <SectionLabel n="02" tone="light">
          {p.label}
        </SectionLabel>
        <h2 className="mt-6 font-display text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">{p.title}</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16">
          {p.items.map((item, i) => (
            <Link
              key={item.title}
              href={cards[i].href}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-navy p-6 text-snow sm:p-8 md:aspect-[3/4]"
            >
              <Image
                src={cards[i].image}
                alt=""
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 33vw, 100vw"
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${cards[i].position}`}
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/65 to-night/0" />
              <span className="absolute left-6 top-6 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[11px] tracking-[0.2em] text-ink sm:left-8 sm:top-8">
                0{i + 1}
              </span>
              <div className="relative">
                <h3 className="font-display text-3xl font-semibold tracking-tight lg:text-4xl">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-mist">{item.body}</p>
                <p className="mt-6 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-[15px] font-semibold transition-colors group-hover:border-green group-hover:text-green">
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
