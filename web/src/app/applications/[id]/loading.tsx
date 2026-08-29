import { Card, Skeleton } from "@/components/ui";

/** The silhouette of one application: title + status, then the history card. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Skeleton className="h-3 w-28" />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>

      <Card className="mt-8">
        <Skeleton className="h-3 w-28" />
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="mt-1.5 size-2 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
