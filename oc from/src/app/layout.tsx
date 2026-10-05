import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EVENT } from "@/lib/constants";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? `https://${EVENT.domain}`),
  title: { default: `Operations Team — ${EVENT.name}`, template: `%s · ESENet OC` },
  description: "Join the operational team behind ESENet Talent Fair 2026 — J-2, J-1 and Jour J. Organised by ESEN Ambassadors.",
  openGraph: {
    title: `Operations Team — ${EVENT.name}`,
    description: "Three days. One team. One mission.",
    siteName: "ESENet OC",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#00040f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${archivo.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-bg text-text antialiased">
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
