import { Skeleton } from "@/components/ui";

/** The silhouette of the profile editor: name, the completeness nudge, then sections. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-56" />

      <Skeleton className="mt-8 h-24 w-full rounded-card" />

      <div className="mt-10 space-y-6">
        <Skeleton className="h-16 w-full rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-11 w-full rounded-ctrl" />
        </div>
      ))}
    </div>
  );
}
