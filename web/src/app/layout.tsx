import type { Metadata, Viewport } from "next";
import { Poppins, Manrope, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esenet-platforme.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ESENet",
    template: "%s · ESENet",
  },
  description:
    "ESENet — the year-round talent network connecting ESEN students, alumni, companies and startups.",
  openGraph: {
    siteName: "ESENet",
    type: "website",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  // The dark navy the header and hero sit on — tints mobile browser chrome.
  themeColor: "#0B0E36",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The one gradient the product is allowed: shared by every MatchArc
            (§8 — the arc, the company banner, the active-tab underline, and
            nowhere else). */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <linearGradient id="esenetArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" />
              <stop offset="55%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--magenta)" />
            </linearGradient>
          </defs>
        </svg>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
