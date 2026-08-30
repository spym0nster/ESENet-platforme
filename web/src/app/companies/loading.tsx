import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the company directory: heading, a search row, then cards. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-2/3 max-w-md" />

      <Skeleton className="mt-8 h-11 w-full max-w-sm rounded-ctrl" />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}>
            <Card>
              <div className="flex gap-3">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-3 h-3 w-full" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
