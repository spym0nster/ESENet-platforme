import Image from "next/image";
import poster from "@/assets/media/hero-poster.jpg";
import { EVENT } from "@/content/event";
import type { Dictionary, Locale } from "@/content/i18n";
import { Countdown } from "../countdown";
import { ButtonLink, Container } from "../ui";

export function Hero({ t, lang }: { t: Dictionary; lang: Locale }) {
  const h = t.hero;
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night">
      {/* Real ESENet 2025 footage. The poster still stays underneath for
          reduced-motion visitors and while the video buffers. */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/30 to-transparent" />
      </div>

      <Container className="flex flex-1 flex-col pt-28 sm:pt-36">
        <div className="flex items-center justify-between gap-6 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-mist/85">
          <p>{h.kicker}</p>
          <p className="hidden sm:block">{h.videoLabel}</p>
        </div>

        <div className="mt-auto grid gap-8 pb-10 pt-16 lg:grid-cols-12 lg:items-end lg:gap-10 lg:pb-14">
          <h1
            id="hero-title"
            className="font-display text-[clamp(4.5rem,19vw,12.5rem)] font-extrabold leading-[0.84] tracking-[-0.05em] lg:col-span-8"
          >
            <span className="block">{h.titleA}</span>
            <span className="block">{h.titleB}</span>
          </h1>
          <div className="lg:col-span-4 lg:pb-3">
            <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{h.tagline}</p>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-mist">{h.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={`/${lang}/register`}>{t.cta.pass}</ButtonLink>
              <ButtonLink href={`/${lang}#partners`} variant="ghost">
                {t.cta.partner}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>

      {/* Ticket-stub strip: the three facts people come for. */}
      <div className="relative border-t border-white/10 bg-navy/80">
        <div aria-hidden className="bg-signature absolute inset-x-0 top-0 h-px" />
        <Container className="grid grid-cols-2 lg:grid-cols-12">
          <div className="py-5 pr-4 lg:col-span-3 lg:py-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-mist/70 sm:text-[11px]">{h.dateLabel}</p>
            <p className="mt-2 text-[15px] font-semibold sm:text-lg">{h.date}</p>
            <p className="text-[14px] text-mist sm:text-[15px]">{h.time}</p>
          </div>
          <div className="border-l border-white/10 py-5 pl-4 lg:col-span-3 lg:py-7 lg:pl-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-mist/70 sm:text-[11px]">{h.venueLabel}</p>
            <p className="mt-2 text-[15px] font-semibold sm:text-lg">{h.venue}</p>
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
