import type { Metadata } from "next";
import Image from "next/image";
import checkin from "@/assets/media/checkin.jpg";
import { notFound } from "next/navigation";
import { EVENT } from "@/content/event";
import { getDictionary, hasLocale } from "@/content/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/sections/closing";
import { ButtonLink, Container, SectionLabel } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/register">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: `${t.register.title} — ESENet 2026`, alternates: { canonical: `/${lang}/register` } };
}

// Placeholder until the pass form ships: says plainly that registration is
// not open yet rather than showing a form that goes nowhere.
export default async function Register({ params }: PageProps<"/[lang]/register">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const r = t.register;

  return (
    <>
      <SiteHeader lang={lang} nav={t.nav} cta={t.cta} />
      <main className="relative isolate flex min-h-[86svh] items-end overflow-hidden bg-night pb-20 pt-40 text-snow">
        {/* the 2025 check-in desk */}
        <Image src={checkin} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-10 object-cover object-[50%_30%] opacity-45" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 to-night/30" />
        <div aria-hidden className="bg-signature absolute inset-x-0 top-16 h-px sm:top-[72px]" />
        <Container>
          <SectionLabel n="—">{r.label}</SectionLabel>
          <h1 className="mt-8 max-w-4xl font-display text-[clamp(3rem,8vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.05em]">
            {r.title}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">{r.body}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={EVENT.instagramUrl} target="_blank" rel="noopener">
              {EVENT.instagramHandle}
            </ButtonLink>
            <ButtonLink href={`/${lang}`} variant="ghost">
              {r.back}
            </ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
