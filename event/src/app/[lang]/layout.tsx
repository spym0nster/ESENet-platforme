import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { LOCALES, getDictionary, hasLocale } from "@/content/i18n";
import { RevealObserver } from "@/components/reveal-observer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

// Outfit is the poster's typeface: titles and display numbers.
const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#07122e",
  colorScheme: "light dark",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: { en: "/en", fr: "/fr" },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      type: "website",
      locale: lang === "fr" ? "fr_TN" : "en_US",
      siteName: "ESENet Talent Fair",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} data-scroll-behavior="smooth" suppressHydrationWarning className={`${jakarta.variable} ${outfit.variable} ${plexMono.variable}`}>
      <head>
        {/* applies the saved theme before first paint: light unless the visitor chose dark */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("esn-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}` }} />
      </head>
      <body className="min-h-dvh bg-white font-sans text-ink">
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
