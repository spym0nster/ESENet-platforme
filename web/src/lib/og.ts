import { readFile } from "node:fs/promises";

/**
 * Poppins for the OG image routes — the same display face as the rest of
 * the product (SemiBold for labels/company, ExtraBold for the headline, to
 * match `font-display font-extrabold` on real headings). Co-located TTFs;
 * `new URL(..., import.meta.url)` is what Next traces into the serverless
 * bundle. Never throws: on any failure the ImageResponse falls back to its
 * built-in sans.
 */
export async function loadOgFonts() {
  try {
    const [semibold, extrabold] = await Promise.all([
      fontData("./fonts/Poppins-SemiBold.ttf"),
      fontData("./fonts/Poppins-ExtraBold.ttf"),
    ]);
    return [
      { name: "Poppins", data: semibold, weight: 600 as const, style: "normal" as const },
      { name: "Poppins", data: extrabold, weight: 800 as const, style: "normal" as const },
    ];
  } catch {
    return [];
  }
}

async function fontData(relPath: string) {
  const url = new URL(relPath, import.meta.url);
  return url.protocol === "file:"
    ? await readFile(url)
    : await fetch(url).then((r) => r.arrayBuffer());
}
