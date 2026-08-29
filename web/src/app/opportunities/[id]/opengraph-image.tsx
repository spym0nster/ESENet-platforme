import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { loadOgFonts } from "@/lib/og";

export const alt = "An opportunity on ESENet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

/**
 * Per-opportunity link preview: role · type · company on the poster
 * gradient. Cost is one small published-row read plus one Satori render
 * the first time each opportunity's card is requested; Next then serves
 * the PNG from the CDN. Falls back to the site default on any error.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fonts = await loadOgFonts();

  let title = "Opportunity";
  let company = "an ESEN partner company";
  let type = "";

  if (isSupabaseConfigured()) {
    try {
      const { data } = await createPublicClient()
        .from("opportunities")
        .select("title, type, status, companies(company_name)")
        .eq("id", id)
        .maybeSingle();
      if (data && data.status === "published") {
        title = String(data.title).slice(0, 90);
        type = TYPE_LABEL[data.type as string] ?? "";
        company =
          (data.companies as unknown as { company_name: string } | null)
            ?.company_name ?? company;
      }
    } catch {
      // fall through to the generic copy
    }
  }

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
          background:
            "linear-gradient(135deg, #0A0C33 0%, #171048 42%, #3C1560 72%, #641274 100%)",
          color: "#F5F3FC",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(245,243,252,0.6)",
          }}
        >
          {type ? `${type} · ESENet` : "ESENet"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 500,
              color: "rgba(245,243,252,0.82)",
            }}
          >
            {company}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
