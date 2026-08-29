import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the applications list: heading, then a row per application. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-2 h-8 w-64" />

      <ul className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="mt-3 h-3 w-40" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
