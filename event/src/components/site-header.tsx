"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import logo from "@/assets/brand/esenet-logo.png";
import type { Dictionary, Locale } from "@/content/i18n";
import { ButtonLink } from "./ui";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const isScrolled = () => window.scrollY > 24;
const notScrolledOnServer = () => false;

export function SiteHeader({
  lang,
  nav,
  cta,
  logoOnScroll = false,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  cta: Dictionary["cta"];
  // On the homepage the hero already shows the big logo, so the header one
  // fades in only once the hero scrolls away.
  logoOnScroll?: boolean;
}) {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolledOnServer);
  const [open, setOpen] = useState(false);

  const other: Locale = lang === "en" ? "fr" : "en";
  const switchHref = pathname.replace(/^\/(en|fr)(?=\/|$)/, `/${other}`);

  const links = [
    { href: `/${lang}#programme`, label: nav.programme },
    { href: `/${lang}#speakers`, label: nav.speakers },
    { href: `/${lang}#partners`, label: nav.partners },
    { href: `/${lang}#venue`, label: nav.venue },
    { href: `/${lang}#faq`, label: nav.faq },
  ];

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-snow transition-colors duration-300 ${
        solid ? "border-b border-white/10 bg-navy" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-6 px-5 sm:h-[72px] sm:px-8 lg:px-12">
        <Link
          href={`/${lang}`}
          className={`shrink-0 transition-opacity duration-300 ${logoOnScroll && !solid ? "pointer-events-none opacity-0" : "opacity-100"}`}
          onClick={() => setOpen(false)}
        >
          <Image src={logo} alt="ESENet Talent Fair" priority className="h-7 w-auto sm:h-8" sizes="160px" />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-mist transition-colors hover:text-snow"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={switchHref}
            hrefLang={other}
            className="hidden h-10 items-center rounded-full px-3 font-mono text-[12px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-snow sm:inline-flex"
            aria-label={nav.language}
          >
            {other}
          </Link>
          {/* ButtonLink is inline-flex itself, so visibility is set on a wrapper. */}
          <div className="hidden xl:block">
            <ButtonLink href={`/${lang}#partners`} variant="ghost" size="sm">
              {cta.partner}
            </ButtonLink>
          </div>
          <div className="hidden sm:block">
            <ButtonLink href={`/${lang}/register`} size="sm">
              {cta.pass}
            </ButtonLink>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 px-4 font-mono text-[12px] uppercase tracking-[0.18em] text-snow lg:hidden"
          >
            {open ? nav.close : nav.menu}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-y-auto bg-navy sm:top-[72px] lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col px-5 pt-6 sm:px-8">
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-white/10 py-5 font-display text-3xl font-bold tracking-tight"
              >
                <span className="font-mono text-xs font-medium text-cyan-bright">0{i + 1}</span>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 px-5 pb-8 pt-10 sm:px-8">
            <ButtonLink href={`/${lang}/register`} onClick={() => setOpen(false)} className="justify-between">
              {cta.pass}
            </ButtonLink>
            <ButtonLink
              href={`/${lang}#partners`}
              variant="ghost"
              onClick={() => setOpen(false)}
              className="justify-between"
            >
              {cta.partner}
            </ButtonLink>
            <Link
              href={switchHref}
              hrefLang={other}
              className="mt-2 py-2 text-center font-mono text-[12px] uppercase tracking-[0.2em] text-mist"
            >
              {nav.language}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
