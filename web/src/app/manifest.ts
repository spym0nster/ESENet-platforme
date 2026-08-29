import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ESENet — ESEN Talent Network",
    short_name: "ESENet",
    description:
      "The year-round talent network connecting ESEN students, alumni, companies and startups.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0E36",
    theme_color: "#0B0E36",
    icons: [
      // Only the wordmark PNG exists as a real asset today; a dedicated
      // square/maskable app icon is still to be produced.
      { src: "/logo.png", sizes: "any", type: "image/png" },
    ],
  };
}
