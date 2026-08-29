import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the saved list: heading, then opportunity cards. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-8 w-64" />

      <ul className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card>
              <div className="flex gap-3">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="mt-2 h-5 w-3/4" />
                </div>
                <Skeleton className="size-[46px] rounded-full" />
              </div>
              <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
