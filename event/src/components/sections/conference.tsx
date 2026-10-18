import Image from "next/image";
import speakerPhoto from "@/assets/media/speaker.jpg";
import { EVENT, PANEL_TIMES, PROGRAMME, SPEAKERS, type Speaker } from "@/content/event";
import type { Dictionary, Locale } from "@/content/i18n";
import { SPEAKERS_2025, type PastSpeaker } from "@/content/past";
import { Flask, NodeIcon, TransmutationRow, type Connector } from "../alchemy";
import { ButtonLink, Container, Glyph, SectionLabel } from "../ui";

const PANEL_BAR = ["bg-blue", "bg-teal", "bg-green-deep"];
const PANEL_TEXT = ["text-blue", "text-teal", "text-green-deep"];
const PANEL_ICONS = ["origins", "lab", "minds"] as const;

export function Panels({ t }: { t: Dictionary }) {
  const p = t.panels;
  return (
    <section id="panels" className="bg-white py-24 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <SectionLabel n="03" tone="light">
              {p.label}
            </SectionLabel>
            <h2 className="mt-6 font-display text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">{p.title}</h2>
          </div>
          <p className="text-[17px] leading-relaxed text-slate lg:col-span-5">{p.intro}</p>
        </div>

        <figure data-reveal className="relative mt-14 aspect-[16/9] overflow-hidden rounded-2xl bg-paper sm:aspect-[21/9] lg:mt-20">
          <Image
            src={speakerPhoto}
            alt={t.history.gallery.speaker}
            fill
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
          <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
            {t.history.gallery.speaker}
          </figcaption>
        </figure>

        <ol className="mt-6 grid lg:grid-cols-3">
          {p.items.map((panel, i) => (
            <li
              key={panel.name}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className={`border-t border-ink/10 py-10 lg:py-12 ${i > 0 ? "lg:border-l lg:pl-10" : ""} ${
                i < 2 ? "lg:pr-10" : ""
              }`}
            >
              <span aria-hidden className={`block h-[3px] w-12 ${PANEL_BAR[i]}`} />
              <p className="mt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
                <span className="flex items-center gap-3">
                  <NodeIcon kind={PANEL_ICONS[i]} className={PANEL_TEXT[i]} />
                  {p.panelWord} 0{i + 1}
                </span>
                <span className="text-ink">{PANEL_TIMES[i]}</span>
              </p>
              <h3 className="mt-6 font-display text-4xl font-semibold tracking-[-0.02em] text-ink xl:text-5xl">{panel.name}</h3>
              <p className={`mt-2 text-[15px] font-medium ${PANEL_TEXT[i]}`}>{panel.tagline}</p>
              <p className="mt-6 text-[15px] leading-[1.7] text-slate">{panel.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// The programme poster as a page: morning sessions on the left, the rest of
// the day on the right, each wired to the flask the data pours into.
const LEFT_ROW = 140; // 4 rows × 140 = 560 = flask height
const RIGHT_ROW = 112; // 5 rows × 112 = 560
const RIGHT_COLORS = ["#12b5d8", "#16c3c8", "#2fd3a0", "#45dc85", "#5be36b"];
const LEFT_COLOR = "#6e8bff";

function SessionCopy({ copy }: { copy: { title: string; sub: string } }) {
  return (
    <>
      <p className="mt-1 text-[17px] font-semibold leading-snug tracking-tight">{copy.title}</p>
      {copy.sub && <p className="text-[15px] italic text-mist/80">{copy.sub}</p>}
    </>
  );
}

export function Programme({ t }: { t: Dictionary }) {
  const p = t.programme;
  const left = PROGRAMME.slice(0, 4);
  const right = PROGRAMME.slice(4);
  const connectors: Connector[] = [
    ...left.map((_, i) => ({ side: "left" as const, y: (i + 0.5) * LEFT_ROW, color: LEFT_COLOR })),
    ...right.map((_, i) => ({ side: "right" as const, y: (i + 0.5) * RIGHT_ROW, color: RIGHT_COLORS[i] })),
  ];

  return (
    <section id="programme" className="relative isolate overflow-hidden bg-night py-24 text-snow lg:py-36">
      <div aria-hidden className="bg-blueprint absolute inset-0 -z-10" />
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <SectionLabel n="04">{p.label}</SectionLabel>
            <h2 className="mt-6 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">{p.title}</h2>
          </div>
          <div className="lg:col-span-5">
            <TransmutationRow align="start" className="text-[11px] sm:text-sm" />
            <p className="mt-4 text-[15px] leading-relaxed text-mist">{p.note}</p>
          </div>
        </div>

        {/* xl+: the poster layout, rows aligned to the flask connectors */}
        <div className="mt-20 hidden grid-cols-[1fr_480px_1fr] xl:grid">
          <ol>
            {left.map((item) => (
              <li key={item.key} data-reveal className="flex items-center gap-4" style={{ height: LEFT_ROW }}>
                <NodeIcon kind={item.key} className="text-blue-light" />
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-blue-light" />
                <div className="min-w-0 max-w-[15rem]">
                  <time
                    dateTime={`2026-11-25T${item.time}`}
                    className="font-display text-4xl font-semibold tabular-nums tracking-tight text-blue-light"
                  >
                    {item.time}
                  </time>
                  <SessionCopy copy={p.items[item.key]} />
                </div>
                <span aria-hidden className="ml-2 h-px min-w-6 flex-1 bg-blue-light/60" />
              </li>
            ))}
          </ol>
          <Flask connectors={connectors} className="h-[560px] w-[480px]" idPrefix="prog" />
          <ol>
            {right.map((item, i) => (
              <li key={item.key} data-reveal className="flex items-center gap-4" style={{ height: RIGHT_ROW }}>
                <span aria-hidden className="mr-2 h-px min-w-6 flex-1 opacity-60" style={{ background: RIGHT_COLORS[i] }} />
                <span style={{ color: RIGHT_COLORS[i] }}>
                  <NodeIcon kind={item.key} />
                </span>
                <div className="w-60 shrink-0" style={{ color: RIGHT_COLORS[i] }}>
                  <time dateTime={`2026-11-25T${item.time}`} className="font-display text-4xl font-semibold tabular-nums tracking-tight">
                    {item.time}
                  </time>
                  <div className="text-snow">
                    <SessionCopy copy={p.items[item.key]} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* below xl: the flask on its own, then the day as a list */}
        <div className="mt-14 xl:hidden">
          <Flask className="mx-auto h-auto w-full max-w-[340px]" idPrefix="prog-sm" />
          <ol className="mt-10 border-t border-white/10 md:grid md:grid-cols-2 md:gap-x-10">
            {PROGRAMME.map((item, i) => {
              const color = i < 4 ? LEFT_COLOR : RIGHT_COLORS[i - 4];
              return (
                <li key={item.key} data-reveal className="flex gap-4 border-b border-white/10 py-5">
                  <span style={{ color }}>
                    <NodeIcon kind={item.key} />
                  </span>
                  <div className="min-w-0">
                    <time
                      dateTime={`2026-11-25T${item.time}`}
                      className="font-display text-3xl font-semibold tabular-nums tracking-tight"
                      style={{ color }}
                    >
                      {item.time}
                    </time>
                    <SessionCopy copy={p.items[item.key]} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="mt-16 font-mono text-[11px] uppercase leading-loose tracking-[0.42em] text-mist/80 xl:mt-10">
          {t.footer.taglineA}
          <br />
          <span className="text-cyan">{t.footer.taglineB}</span>
        </p>
      </Container>
    </section>
  );
}

// The brand motif drawn as a small constellation, different for each card.
function Constellation({ seed, className = "absolute right-0 top-0 size-3/4" }: { seed: number; className?: string }) {
  const sets = [
    [[40, 60], [120, 40], [90, 130], [180, 110], [150, 200]],
    [[60, 40], [150, 70], [50, 150], [130, 170], [200, 130]],
    [[30, 120], [100, 60], [170, 40], [120, 150], [190, 190]],
    [[70, 50], [40, 160], [140, 110], [200, 60], [170, 200]],
  ];
  const pts = sets[seed % sets.length];
  return (
    <svg aria-hidden viewBox="0 0 240 240" className={className}>
      {pts.slice(1).map(([x, y], i) => (
        <line key={i} x1={pts[i][0]} y1={pts[i][1]} x2={x} y2={y} stroke="rgba(10,22,56,0.16)" strokeWidth="1" />
      ))}
      {pts.map(([x, y], i) =>
        i % 3 === 0 ? (
          <circle key={i} cx={x} cy={y} r="4" fill="#2a48d0" />
        ) : i % 3 === 1 ? (
          <circle key={i} cx={x} cy={y} r="5" fill="none" stroke="#12b5d8" strokeWidth="2" />
        ) : (
          <rect key={i} x={x - 4} y={y - 4} width="8" height="8" fill="#18843f" />
        ),
      )}
    </svg>
  );
}

// Brand-tinted grounds behind the cut-out portraits: data blue,
// intelligence cyan, value green, in turn.
const PORTRAIT_GROUNDS = [
  "from-[#c9d4ff] via-[#e4e9ff] to-[#f4f6ff]",
  "from-[#bfeaf3] via-[#e0f6fa] to-[#f3fbfd]",
  "from-[#c8f0d2] via-[#e3f8e8] to-[#f3fcf5]",
];
const PORTRAIT_GLYPH = [0, 1, 2] as const;

type Voice = { name: string; role: string; org: string; photo?: Speaker["photo"] | PastSpeaker["photo"]; tag: string };

function VoiceCard({ v, i }: { v: Voice; i: number }) {
  return (
    <li className="w-56 shrink-0 sm:w-64">
      <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b ${PORTRAIT_GROUNDS[i % 3]}`}>
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
          <Glyph kind={PORTRAIT_GLYPH[i % 3]} />
          {v.tag}
        </span>
        {v.photo && (
          <Image src={v.photo} alt={v.name} fill sizes="256px" className="object-contain object-bottom" />
        )}
      </div>
      <p className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight text-ink">{v.name}</p>
      <p className="mt-1 text-[13px] leading-snug text-slate">
        {v.role}
        {v.org && (
          <>
            {" · "}
            <span className="font-medium text-ink/80">{v.org}</span>
          </>
        )}
      </p>
    </li>
  );
}

// "ESENet Voices", after VivaTech Voices / bigtech.africa: every speaker in
// one drifting row. 2026 speakers lead as they are announced; last year's
// stage follows.
export function Speakers({ t, lang }: { t: Dictionary; lang: Locale }) {
  const s = t.speakers;
  const voices: Voice[] = [
    ...SPEAKERS.map((sp) => ({ name: sp.name, role: sp.role, org: sp.org, photo: sp.photo, tag: "2026" })),
    ...SPEAKERS_2025.map((sp) => ({ name: sp.name, role: sp.role[lang], org: sp.org, photo: sp.photo, tag: "2025" })),
  ];
  // Until 2026 speakers are confirmed, one placeholder per session.
  const slots = [
    { session: t.panels.items[0].name, time: PANEL_TIMES[0] },
    { session: t.panels.items[1].name, time: PANEL_TIMES[1] },
    { session: t.panels.items[2].name, time: PANEL_TIMES[2] },
    { session: t.programme.items.workshop.title, time: "14:00" },
  ];
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5">
      {voices.map((v, i) => (
        <VoiceCard key={`${v.name}-${hidden}`} v={v} i={i} />
      ))}
    </ul>
  );

  return (
    <section id="speakers" className="overflow-hidden bg-white py-24 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <SectionLabel n="05" tone="light">
              {s.label}
            </SectionLabel>
            <h2 className="mt-6 font-display text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">
              ESENet{" "}
              <span className="bg-gradient-to-r from-blue via-teal to-green-deep bg-clip-text text-transparent">Voices</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[17px] leading-relaxed text-slate">{s.intro}</p>
            <ButtonLink href={EVENT.instagramUrl} variant="outline" className="mt-6" target="_blank" rel="noopener">
              {EVENT.instagramHandle}
            </ButtonLink>
          </div>
        </div>
      </Container>

      <div className="group mt-14 flex [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)] lg:mt-20">
        <div className="animate-marquee-slow flex w-max group-hover:[animation-play-state:paused]">
          {row(false)}
          {row(true)}
        </div>
      </div>

      <Container>
        <div className="mt-16 flex flex-col gap-5 border-t border-ink/10 pt-10 lg:mt-20 lg:flex-row lg:items-center lg:gap-10">
          <div className="shrink-0 lg:w-56">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-slate">{s.upcoming}</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{s.title}</p>
          </div>
          <ul className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
            {slots.map((slot, i) => (
              <li
                key={slot.session}
                data-reveal
                style={{ transitionDelay: `${i * 80}ms` }}
                className="relative flex min-h-28 flex-col justify-end overflow-hidden rounded-2xl border border-ink/10 bg-paper p-4"
              >
                <Constellation seed={i} className="absolute -right-2 -top-2 size-20 opacity-80" />
                <p className="relative font-mono text-[10px] uppercase tracking-[0.22em] text-teal">{s.tba}</p>
                <p className="relative mt-1 font-display text-lg font-semibold leading-tight tracking-tight text-ink">{slot.session}</p>
                <p className="relative font-mono text-[11px] tracking-[0.16em] text-slate">{slot.time}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
