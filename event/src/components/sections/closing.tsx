import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/brand/esenet-logo.png";
import facade from "@/assets/media/facade.jpg";
import { EVENT } from "@/content/event";
import type { Dictionary, Locale } from "@/content/i18n";
import { ButtonLink, Container, SectionLabel } from "../ui";

export function Faq({ t }: { t: Dictionary }) {
  const f = t.faq;
  return (
    <section id="faq" className="bg-paper py-24 text-ink lg:py-36">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <SectionLabel n="09" tone="light">
            {f.label}
          </SectionLabel>
          <h2 className="mt-6 font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl">{f.title}</h2>
        </div>
        <div className="border-t border-ink/20 lg:col-span-8">
          {f.items.map((item) => (
            <details key={item.q} className="group border-b border-ink/15">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-lg font-semibold tracking-tight sm:text-xl">
                {item.q}
                <span
                  aria-hidden
                  className="relative size-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-[1.5px] before:w-4 before:-translate-y-1/2 before:bg-ink after:absolute after:left-1/2 after:top-0 after:h-4 after:w-[1.5px] after:-translate-x-1/2 after:bg-ink after:transition-transform group-open:after:scale-y-0"
                />
              </summary>
              <p className="max-w-2xl pb-7 text-[16px] leading-[1.7] text-ink/70">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FinalCall({ t, lang }: { t: Dictionary; lang: Locale }) {
  return (
    <section className="relative isolate overflow-hidden bg-night py-28 text-snow lg:py-44">
      <Image src={facade} alt="" fill placeholder="blur" sizes="100vw" className="-z-10 object-cover object-[50%_30%] opacity-35" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 to-night/40" />
      <Container>
        <h2
          data-reveal
          className="font-display text-[clamp(3.25rem,10vw,9.5rem)] font-extrabold leading-[0.9] tracking-[-0.05em]"
        >
          <span className="block text-mist/60">{t.final.titleA}</span>
          <span className="block">{t.final.titleB}</span>
        </h2>
        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg text-mist">{t.final.body}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/${lang}/register`}>{t.cta.pass}</ButtonLink>
            <ButtonLink href={`/${lang}#partners`} variant="ghost">
              {t.cta.partner}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function SiteFooter({ t, lang }: { t: Dictionary; lang: Locale }) {
  const f = t.footer;
  const explore = [
    { href: `/${lang}#programme`, label: t.nav.programme },
    { href: `/${lang}#speakers`, label: t.nav.speakers },
    { href: `/${lang}#partners`, label: t.nav.partners },
    { href: `/${lang}#venue`, label: t.nav.venue },
    { href: `/${lang}#faq`, label: t.nav.faq },
  ];
  const linkClass = "text-[15px] text-mist transition-colors hover:text-snow";
  return (
    <footer className="border-t border-white/10 bg-night text-snow">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="sm:col-span-2 lg:col-span-5">
          <Image src={logo} alt="ESENet Talent Fair" className="h-10 w-auto" sizes="220px" />
          <p className="mt-6 font-mono text-[11px] uppercase leading-loose tracking-[0.32em] text-mist/80">
            {f.taglineA}
            <br />
            <span className="text-cyan">{f.taglineB}</span>
          </p>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-mist/80">{f.organised}</p>
        </div>
        <nav aria-label={f.explore} className="lg:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-mist/50">{f.explore}</p>
          <ul className="mt-5 space-y-3">
            {explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lg:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-mist/50">{f.contact}</p>
          <ul className="mt-5 space-y-3">
            <li>
              <a href={EVENT.instagramUrl} target="_blank" rel="noopener" className={linkClass}>
                Instagram
              </a>
            </li>
            <li>
              <a href={`mailto:${EVENT.contactEmail}`} className={linkClass}>
                {EVENT.contactEmail}
              </a>
            </li>
          </ul>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-mist/50">{f.platform}</p>
          <p className="mt-5 text-[15px] leading-relaxed text-mist">{f.platformBody}</p>
          <a
            href={EVENT.platformUrl}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-block border-b border-white/30 pb-0.5 text-[15px] font-semibold transition-colors hover:border-green hover:text-green"
          >
            esenet-platforme.vercel.app
          </a>
        </div>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-white/10 py-6 font-mono text-[11px] uppercase tracking-[0.18em] text-mist/50 sm:flex-row sm:justify-between">
        <p>{f.rights}</p>
        <p>25.11.2026 · Manouba</p>
      </Container>
    </footer>
  );
}
