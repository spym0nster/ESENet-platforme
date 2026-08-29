/**
 * A company's mark. With a `src` it's the uploaded logo; without one it's
 * the initials on the poster-gradient tile with a white top highlight —
 * never a grey square, never a broken image.
 */
const SIZES = {
  sm: "size-9 rounded-[10px] text-xs",
  md: "size-11 rounded-xl text-sm",
  lg: "size-16 rounded-2xl text-xl",
  xl: "size-20 rounded-2xl text-2xl",
} as const;

export function CompanyLogo({
  name,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shared = `${SIZES[size]} shrink-0 grid place-items-center overflow-hidden font-display font-semibold text-white ${className}`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
      <img
        src={src}
        alt=""
        // object-contain on a neutral tile: a wide or oddly-cropped logo
        // letterboxes inside the same box instead of breaking the row.
        className={`${shared} bg-surface-alt object-contain p-1.5`}
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <span
      aria-hidden
      className={`${shared} [background:var(--logo-grad)] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.22)]`}
    >
      {initials}
    </span>
  );
}
