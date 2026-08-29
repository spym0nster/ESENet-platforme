import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the detail page: a hero card, then body copy. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-3 w-32" />

      <Card className="mt-4 p-6">
        <div className="flex gap-4">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-6 w-3/4" />
          </div>
          <Skeleton className="size-[46px] rounded-full" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="mt-2 h-4 w-20" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-6 h-11 w-28 rounded-ctrl" />
      </Card>

      <div className="mt-8 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
