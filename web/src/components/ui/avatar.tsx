/**
 * A person's avatar. Uploaded photo, or initials on a cyan→violet tile
 * with a white top highlight. Round, unlike CompanyLogo.
 */
const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
} as const;

export function Avatar({
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
  const shared = `${SIZES[size]} shrink-0 grid place-items-center overflow-hidden rounded-full font-display font-semibold text-white ${className}`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
      <img src={src} alt="" className={`${shared} object-cover`} />
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
      className={`${shared} [background:linear-gradient(140deg,var(--accent-2),var(--accent))] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.22)]`}
    >
      {initials}
    </span>
  );
}
