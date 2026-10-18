import Image from "next/image";
import logo from "@/assets/brand/esenet-logo.png";
import poster from "@/assets/media/hero-poster.jpg";
import { EVENT } from "@/content/event";
import type { Dictionary, Locale } from "@/content/i18n";
import { RuledLine, TitleLockup, TransmutationRow } from "../alchemy";
import { Countdown } from "../countdown";
import { ButtonLink, Container } from "../ui";

// Same stack as the Data Alchimie poster: logo, edition, the title lockup,
// "Turning Data into Value", the Data → Intelligence → Value row — over real
// ESENet 2025 footage instead of the poster's rendered hall.
export function Hero({ t, lang }: { t: Dictionary; lang: Locale }) {
  const h = t.hero;
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night text-snow">
      <div className="absolute inset-0 -z-10">
        <Image src={poster} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover" />
        <video
          className="motion-video absolute inset-0 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster.src}
          aria-hidden
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-navy/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(4,10,28,0.55)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy to-transparent" />
      </div>

      <Container className="flex flex-1 flex-col items-center justify-center pb-12 pt-28 text-center sm:pt-32">
        <Image
          src={logo}
          alt="ESENet Talent Fair"
          priority
          sizes="(min-width: 768px) 420px, 240px"
          className="h-auto w-[min(62vw,240px)] md:w-[clamp(280px,30vw,420px)]"
        />
        <RuledLine className="mt-5 font-mono text-[11px] font-medium uppercase tracking-[0.42em] text-snow/90 sm:mt-6 sm:text-xs">
          {h.edition}
        </RuledLine>

        <TitleLockup
          id="hero-title"
          className="mt-8 text-[clamp(3.9rem,19vw,5.6rem)] text-snow sm:mt-10 md:text-[clamp(5rem,10.6vw,10.25rem)]"
        />

        <RuledLine className="mt-6 font-display text-xl font-light tracking-tight text-snow sm:mt-8 sm:text-3xl">
          {h.tagline}
        </RuledLine>
        <TransmutationRow className="mt-4 text-[11px] sm:mt-5 sm:text-base" />

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <ButtonLink href={`/${lang}/register`}>{t.cta.pass}</ButtonLink>
          <ButtonLink href={`/${lang}#partners`} variant="ghost">
            {t.cta.partner}
          </ButtonLink>
        </div>
      </Container>

      {/* Ticket-stub strip: the three facts people come for. */}
      <div className="relative border-t border-white/10 bg-navy/85">
        <div aria-hidden className="bg-signature absolute inset-x-0 top-0 h-px" />
        <Container className="grid grid-cols-2 lg:grid-cols-12">
          <div className="py-5 pr-4 lg:col-span-3 lg:py-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-mist/70 sm:text-[11px]">{h.dateLabel}</p>
            <p className="mt-2 font-display text-[17px] font-semibold sm:text-xl">{h.date}</p>
            <p className="text-[14px] text-mist sm:text-[15px]">{h.time}</p>
          </div>
          <div className="border-l border-white/10 py-5 pl-4 lg:col-span-3 lg:py-7 lg:pl-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-mist/70 sm:text-[11px]">{h.venueLabel}</p>
            <p className="mt-2 font-display text-[17px] font-semibold sm:text-xl">{h.venue}</p>
            <p className="text-[14px] text-mist sm:text-[15px]">{h.city}</p>
          </div>
          <div className="col-span-2 border-t border-white/10 py-5 lg:col-span-6 lg:border-l lg:border-t-0 lg:py-7 lg:pl-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-mist/70 sm:text-[11px]">{h.countdownLabel}</p>
            <Countdown startsAt={EVENT.startsAt} endsAt={EVENT.endsAt} units={h.units} live={h.live} over={h.over} />
          </div>
        </Container>
      </div>
    </section>
  );
}
