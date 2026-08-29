import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the team page: heading, then member rows. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-8 w-40" />

      <div className="mt-10 space-y-6">
        {[0, 1].map((section) => (
          <div key={section}>
            <Skeleton className="h-3 w-28" />
            <div className="mt-3 space-y-2">
              {[0, 1].map((i) => (
                <Card key={i} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-ctrl" />
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
