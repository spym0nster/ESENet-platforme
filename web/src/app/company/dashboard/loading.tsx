import { Card, Skeleton } from "@/components/ui";

/** Silhouette of the company dashboard: header, the stat strip, then posting rows. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-8 w-64" />

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface px-4 py-3">
            <Skeleton className="h-7 w-10" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-5 w-24" />
      <ul className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Skeleton className="h-9 w-40 rounded-ctrl" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
