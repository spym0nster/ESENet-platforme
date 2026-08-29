/**
 * A single shimmer block. It has no shape of its own — compose it into the
 * silhouette of whatever is loading (a logo tile, two title bars, a chip
 * row) in the route's `loading.tsx`. Never drop one lone full-width bar and
 * call it a loading state.
 *
 * `animate-pulse` (opacity, not a travelling gradient) is the restrained
 * choice; the global reduced-motion rule and `motion-reduce:animate-none`
 * both still it.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-chip bg-text/8 motion-reduce:animate-none ${className}`}
    />
  );
}
