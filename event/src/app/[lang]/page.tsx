import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/content/i18n";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/sections/hero";
import { Edition, Numbers, Paths, Ticker } from "@/components/sections/intro";
import { Panels, Programme, Speakers } from "@/components/sections/conference";
import { Partners } from "@/components/sections/partners";
import { Trusted } from "@/components/sections/trusted";
import { History, Venue } from "@/components/sections/story";
import { Faq, FinalCall, SiteFooter } from "@/components/sections/closing";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-green px-4 py-2 font-semibold text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.skip}
      </a>
      <SiteHeader lang={lang} nav={t.nav} cta={t.cta} logoOnScroll />
      <main id="main">
        <Hero t={t} lang={lang} />
        <Ticker items={t.ticker} />
        <Numbers t={t} />
        <Edition t={t} lang={lang} />
        <Paths t={t} lang={lang} />
        <Panels t={t} />
        <Programme t={t} />
        <Speakers t={t} lang={lang} />
        <Trusted t={t} />
        <Partners t={t} />
        <History t={t} />
        <Venue t={t} />
        <Faq t={t} />
        <FinalCall t={t} lang={lang} />
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
