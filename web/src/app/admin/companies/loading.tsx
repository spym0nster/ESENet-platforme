import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the company-verification queue. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-3 w-16" />
      <Skeleton className="mt-2 h-8 w-64" />
      <Skeleton className="mt-2 h-3 w-80" />

      <div className="mt-10">
        <Skeleton className="h-3 w-32" />
        <ul className="mt-4 space-y-3">
          {[0, 1].map((i) => (
            <li key={i}>
              <Card className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-52" />
                </div>
                <Skeleton className="h-9 w-24 rounded-ctrl" />
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
