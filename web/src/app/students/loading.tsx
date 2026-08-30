import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the student directory: heading, filters, then profile cards. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-2/3 max-w-md" />

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Skeleton className="h-11 rounded-ctrl" />
        <Skeleton className="h-11 rounded-ctrl sm:w-40" />
        <Skeleton className="h-11 w-24 rounded-ctrl" />
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}>
            <Card>
              <div className="flex gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-40" />
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-16" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
