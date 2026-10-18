import Image from "next/image";
import speakerPhoto from "@/assets/media/speaker.jpg";
import { EVENT, PANEL_TIMES, PROGRAMME, SPEAKERS, type ProgrammeTag } from "@/content/event";
import type { Dictionary } from "@/content/i18n";
import { ButtonLink, Container, SectionLabel } from "../ui";

const PANEL_BAR = ["bg-blue-light", "bg-cyan", "bg-green"];
const PANEL_TEXT = ["text-blue-light", "text-cyan", "text-green"];

export function Panels({ t }: { t: Dictionary }) {
  const p = t.panels;
  return (
    <section id="panels" className="bg-ink py-24 lg:py-36">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <SectionLabel n="03">{p.label}</SectionLabel>
            <h2 className="mt-6 font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">{p.title}</h2>
          </div>
          <p className="text-[17px] leading-relaxed text-mist lg:col-span-5">{p.intro}</p>
        </div>

        <figure data-reveal className="relative mt-14 aspect-[16/9] overflow-hidden rounded-sm bg-night sm:aspect-[21/9] lg:mt-20">
          <Image
            src={speakerPhoto}
            alt={t.history.gallery.speaker}
            fill
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
          <figcaption className="absolute bottom-0 left-0 bg-night/85 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
            {t.history.gallery.speaker}
          </figcaption>
        </figure>

        <ol className="mt-4 grid lg:grid-cols-3">
          {p.items.map((panel, i) => (
            <li
              key={panel.name}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className={`border-t border-white/10 py-10 lg:py-12 ${i > 0 ? "lg:border-l lg:pl-10" : ""} ${
                i < 2 ? "lg:pr-10" : ""
              }`}
            >
              <span aria-hidden className={`block h-[3px] w-12 ${PANEL_BAR[i]}`} />
              <p className="mt-6 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-mist/70">
                <span>
                  {p.panelWord} 0{i + 1}
                </span>
                <span className="text-snow">{PANEL_TIMES[i]}</span>
              </p>
              <h3 className="mt-6 font-display text-4xl font-bold tracking-[-0.03em] xl:text-5xl">{panel.name}</h3>
              <p className={`mt-2 text-[15px] font-medium ${PANEL_TEXT[i]}`}>{panel.tagline}</p>
              <p className="mt-6 text-[15px] leading-[1.7] text-mist">{panel.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// Tags on the light programme section. Panels pick up their brand accent;
// everything else stays a quiet outline.
const TAG_STYLE: Record<ProgrammeTag, string> = {
  welcome: "border border-ink/20 text-ink/70",
  plenary: "border border-ink/20 text-ink/70",
  networking: "border border-ink/20 text-ink/70",
  companies: "border border-ink/20 text-ink/70",
  workshop: "border border-ink/20 text-ink/70",
  panel: "",
};
const PANEL_TAG = ["bg-blue text-snow", "bg-teal text-snow", "bg-green text-night"];

export function Programme({ t }: { t: Dictionary }) {
  const p = t.programme;
  const halves = ["morning", "afternoon"] as const;
  return (
    <section id="programme" className="bg-paper py-24 text-ink lg:py-36">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel n="04" tone="light">
              {p.label}
            </SectionLabel>
            <h2 className="mt-6 font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl">{p.title}</h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink/65">{p.note}</p>
          </div>
        </div>

        <div className="space-y-14 lg:col-span-8">
          {halves.map((half) => (
            <div key={half}>
              <h3 className="border-b border-ink/20 pb-4 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-ink/55">
                {p[half]}
              </h3>
              <ol>
                {PROGRAMME.filter((item) => item.half === half).map((item) => {
                  const copy = p.items[item.key];
                  const panel = "panel" in item ? item.panel : undefined;
                  return (
                    <li
                      key={item.key}
                      data-reveal
                      className="grid grid-cols-[4.75rem_1fr] items-baseline gap-x-5 border-b border-ink/10 py-6 sm:grid-cols-[6.5rem_1fr_auto] sm:gap-x-8"
                    >
                      <time
                        dateTime={`2026-11-25T${item.time}`}
                        className="font-display text-2xl font-bold tabular-nums tracking-tight sm:text-3xl"
                      >
                        {item.time}
                      </time>
                      <div>
                        <p className="text-lg font-semibold tracking-tight sm:text-xl">{copy.title}</p>
                        {copy.sub && <p className="mt-1 text-[15px] text-ink/60">{copy.sub}</p>}
                      </div>
                      <span
                        className={`col-start-2 mt-3 justify-self-start rounded-full px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] sm:col-start-auto sm:mt-0 sm:justify-self-end ${
                          panel === undefined ? TAG_STYLE[item.tag] : PANEL_TAG[panel]
                        }`}
                      >
                        {p.tags[item.tag]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// The brand motif drawn as a small constellation, different for each card.
function Constellation({ seed }: { seed: number }) {
  const sets = [
    [[40, 60], [120, 40], [90, 130], [180, 110], [150, 200]],
    [[60, 40], [150, 70], [50, 150], [130, 170], [200, 130]],
    [[30, 120], [100, 60], [170, 40], [120, 150], [190, 190]],
    [[70, 50], [40, 160], [140, 110], [200, 60], [170, 200]],
  ];
  const pts = sets[seed % sets.length];
  return (
    <svg aria-hidden viewBox="0 0 240 240" className="absolute right-0 top-0 size-3/4 opacity-70">
      {pts.slice(1).map(([x, y], i) => (
        <line key={i} x1={pts[i][0]} y1={pts[i][1]} x2={x} y2={y} stroke="rgba(198,209,234,0.18)" strokeWidth="1" />
      ))}
      {pts.map(([x, y], i) =>
        i % 3 === 0 ? (
          <circle key={i} cx={x} cy={y} r="4" fill="#6e8bff" />
        ) : i % 3 === 1 ? (
          <circle key={i} cx={x} cy={y} r="5" fill="none" stroke="#12b5d8" strokeWidth="2" />
        ) : (
          <rect key={i} x={x - 4} y={y - 4} width="8" height="8" fill="#5be36b" />
        ),
      )}
    </svg>
  );
}

export function Speakers({ t }: { t: Dictionary }) {
  const s = t.speakers;
  // Until speakers are confirmed, one placeholder per session.
  const slots = [
    { session: t.panels.items[0].name, time: PANEL_TIMES[0] },
    { session: t.panels.items[1].name, time: PANEL_TIMES[1] },
    { session: t.panels.items[2].name, time: PANEL_TIMES[2] },
    { session: t.programme.items.workshop.title, time: "14:00" },
  ];
  return (
    <section id="speakers" className="bg-navy py-24 lg:py-36">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-8">
            <SectionLabel n="05">{s.label}</SectionLabel>
            <h2 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              {s.title}
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[17px] leading-relaxed text-mist">{s.intro}</p>
            <ButtonLink href={EVENT.instagramUrl} variant="ghost" className="mt-6" target="_blank" rel="noopener">
              {EVENT.instagramHandle}
            </ButtonLink>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-20 lg:grid-cols-4">
          {SPEAKERS.length > 0
            ? SPEAKERS.map((sp) => (
                <li key={sp.name} data-reveal className="relative aspect-[3/4] overflow-hidden rounded-sm bg-ink">
                  {sp.photo && (
                    <Image src={sp.photo} alt={sp.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night to-transparent p-5 pt-16">
                    <p className="font-display text-xl font-bold tracking-tight">{sp.name}</p>
                    <p className="text-[14px] text-mist">
                      {sp.role}, {sp.org}
                    </p>
                  </div>
                </li>
              ))
            : slots.map((slot, i) => (
                <li
                  key={slot.session}
                  data-reveal
                  style={{ transitionDelay: `${i * 80}ms` }}
                  className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-sm border border-white/10 bg-ink p-4 sm:p-6"
                >
                  <Constellation seed={i} />
                  <p className="relative font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-bright sm:text-[11px]">
                    {s.tba}
                  </p>
                  <p className="relative mt-2 font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                    {slot.session}
                  </p>
                  <p className="relative mt-1 font-mono text-[11px] tracking-[0.16em] text-mist/60">{slot.time}</p>
                </li>
              ))}
        </ul>
      </Container>
    </section>
  );
}
