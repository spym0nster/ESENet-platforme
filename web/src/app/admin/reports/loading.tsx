import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the content-reports queue. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-3 w-16" />
      <Skeleton className="mt-2 h-8 w-56" />
      <Skeleton className="mt-2 h-3 w-80" />

      <div className="mt-10">
        <Skeleton className="h-3 w-12" />
        <ul className="mt-4 space-y-3">
          {[0, 1].map((i) => (
            <li key={i}>
              <Card className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-16 w-full rounded-ctrl" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-8 w-20 rounded-ctrl" />
                  <Skeleton className="h-8 w-32 rounded-ctrl" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
