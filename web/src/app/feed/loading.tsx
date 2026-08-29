import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the feed: a composer, then a list of posts. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-24" />
      <Skeleton className="mt-3 h-3 w-3/4" />

      <Skeleton className="mt-8 h-28 rounded-card" />

      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((i) => (
          <li key={i} className="list-none">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="mt-2 h-2.5 w-28" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Skeleton className="h-4 w-32" />
              </div>
            </Card>
          </li>
        ))}
      </div>
    </div>
  );
}
