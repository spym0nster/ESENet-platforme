import Image from "next/image";
import type { ReactNode } from "react";
import checkin from "@/assets/media/checkin.jpg";
import networkingStands from "@/assets/media/networking-stands.jpg";
import { EVENT } from "@/content/event";
import type { Locale } from "@/content/i18n";
import { getDictionary } from "@/content/i18n";
import { SiteFooter } from "./sections/closing";
import { SiteHeader } from "./site-header";
import { Container, Glyph, SectionLabel } from "./ui";

type Aside = { title: string; steps: { t: string; d: string }[] };

// Shared frame for the registration pages: a navy title band over a real
// photo from the 2025 edition, then the form on a white card beside a
// "how it works" panel. Pages without an aside (ticket, badge, thanks) get a
// single centred column.
export function FormPage({
  lang,
  label,
  title,
  body,
  photo = "checkin",
  aside,
  children,
}: {
  lang: Locale;
  label: string;
  title: string;
  body?: string;
  photo?: "checkin" | "stands";
  aside?: Aside;
  children: ReactNode;
}) {
  const t = getDictionary(lang);
  const facts = [
    { k: t.hero.dateLabel, v: t.hero.date },
    { k: t.venue.details[1]?.k, v: t.venue.details[1]?.v },
  ];
  return (
    <>
      <SiteHeader lang={lang} nav={t.nav} cta={t.cta} />
      <main>
        <div className="relative isolate overflow-hidden bg-night pb-16 pt-36 text-snow sm:pt-44 lg:pb-24">
          <Image
            src={photo === "stands" ? networkingStands : checkin}
            alt=""
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            className="-z-10 object-cover object-[50%_35%] opacity-35"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/75 to-night/40" />
          <div aria-hidden className="bg-signature absolute inset-x-0 top-16 h-px sm:top-[72px]" />
          <Container>
            <SectionLabel n="—">{label}</SectionLabel>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
              {title}
            </h1>
            {body && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">{body}</p>}
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] uppercase tracking-[0.2em] text-cyan-bright">
              <span>25.11.2026</span>
              <Glyph kind={1} />
              <span>ESEN Technopôle · Manouba</span>
            </p>
          </Container>
        </div>

        <div className="bg-paper pb-20 lg:pb-28">
          <Container className={`relative z-10 -mt-8 lg:-mt-12 ${aside ? "" : "max-w-3xl"}`}>
            <div className={aside ? "grid items-start gap-6 lg:grid-cols-12 lg:gap-8" : ""}>
              {aside && (
                <aside className="relative overflow-hidden rounded-3xl bg-navy p-7 text-snow lg:sticky lg:top-24 lg:col-span-4 lg:p-8">
                  <div aria-hidden className="bg-signature absolute inset-x-0 top-0 h-[3px]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-bright">{aside.title}</p>
                  <ol className="mt-6 space-y-6">
                    {aside.steps.map((s, i) => (
                      <li key={s.t} className="flex gap-4">
                        <span className="mt-1 flex w-8 shrink-0 items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] text-blue-light">
                          <Glyph kind={(i % 3) as 0 | 1 | 2} />0{i + 1}
                        </span>
                        <div>
                          <p className="font-display text-lg font-semibold leading-snug tracking-tight">{s.t}</p>
                          <p className="mt-1 text-[14px] leading-relaxed text-mist">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <dl className="mt-8 space-y-3 border-t border-white/10 pt-6">
                    {facts.map((f) => (
                      <div key={f.k} className="grid grid-cols-[5.5rem_1fr] gap-3">
                        <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist/70">{f.k}</dt>
                        <dd className="text-[14px] font-medium">{f.v}</dd>
                      </div>
                    ))}
                  </dl>
                  <a href={`mailto:${EVENT.contactEmail}`} className="mt-6 block text-[14px] text-cyan-bright underline underline-offset-4">
                    {EVENT.contactEmail}
                  </a>
                </aside>
              )}
              <div
                className={`rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(7,18,46,0.45)] sm:p-10 ${
                  aside ? "lg:col-span-8" : ""
                }`}
              >
                {children}
              </div>
            </div>
          </Container>
        </div>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
