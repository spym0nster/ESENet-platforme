/**
 * The ESENet poster gradient — navy → violet → magenta, the four stops from
 * the pitch deck. This module is the single source for every place it
 * appears:
 *   - the marketing hero    → `--poster-grad` on :root, set from RootLayout
 *   - the company banner     → posterGradient("135deg")
 *   - both OG image routes    → posterGradient("135deg") (Satori can't read
 *                               CSS custom properties, so it takes the string)
 *
 * §8 of UX_ELEVATION.md permits this gradient on the marketing page and the
 * company banner — nowhere else.
 */
export const POSTER_GRADIENT_STOPS =
  "#0A0C33 0%, #171048 42%, #3C1560 72%, #641274 100%";

export function posterGradient(angle = "180deg"): string {
  return `linear-gradient(${angle}, ${POSTER_GRADIENT_STOPS})`;
}
