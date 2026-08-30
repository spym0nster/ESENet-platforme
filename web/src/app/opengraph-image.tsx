import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og";
import { posterGradient } from "@/lib/poster-gradient";

export const alt = "ESENet — the year-round ESEN talent network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The default link preview for every route (routes with their own
 * generateMetadata can still override `openGraph.images`). Poster gradient,
 * wordmark, one line — set in Poppins, the product's display face.
 */
export default async function Image() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: posterGradient("135deg"),
          color: "#F5F3FC",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(245,243,252,0.6)",
          }}
        >
          ESEN · Talent Fair
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 128, fontWeight: 800, lineHeight: 1 }}>ESENet</div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 500,
              color: "rgba(245,243,252,0.82)",
            }}
          >
            Students, alumni and companies — connected all year.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
