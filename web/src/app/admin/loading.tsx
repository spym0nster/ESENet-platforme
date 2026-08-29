import { Skeleton } from "@/components/ui";

/** Silhouette of the admin overview: heading, an attention card, then stat strips. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-8 w-40" />
      <Skeleton className="mt-3 h-3 w-56" />

      <Skeleton className="mt-8 h-20 w-full rounded-card" />

      {[0, 1].map((section) => (
        <div key={section} className="mt-10">
          <Skeleton className="h-3 w-24" />
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-surface px-4 py-3">
                <Skeleton className="h-7 w-10" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
