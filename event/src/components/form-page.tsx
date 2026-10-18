import type { ReactNode } from "react";
import type { Locale } from "@/content/i18n";
import { getDictionary } from "@/content/i18n";
import { SiteFooter } from "./sections/closing";
import { SiteHeader } from "./site-header";
import { Container, SectionLabel } from "./ui";

// Shared frame for the registration pages: navy title band (the logo and
// header only read on dark), then the form on the light page.
export function FormPage({
  lang,
  label,
  title,
  body,
  children,
}: {
  lang: Locale;
  label: string;
  title: string;
  body?: string;
  children: ReactNode;
}) {
  const t = getDictionary(lang);
  return (
    <>
      <SiteHeader lang={lang} nav={t.nav} cta={t.cta} />
      <main>
        <div className="relative isolate overflow-hidden bg-night pb-14 pt-36 text-snow sm:pt-44">
          <div aria-hidden className="bg-signature absolute inset-x-0 top-16 h-px sm:top-[72px]" />
          <Container>
            <SectionLabel n="—">{label}</SectionLabel>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
              {title}
            </h1>
            {body && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">{body}</p>}
          </Container>
        </div>
        <div className="bg-white py-14 lg:py-20">
          <Container className="max-w-4xl">{children}</Container>
        </div>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
