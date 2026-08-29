import { Card, Skeleton } from "@/components/ui";

/** The silhouette of the applicants list: heading, then applicant cards. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-8 w-64" />
      <Skeleton className="mt-2 h-3 w-40" />

      <ul className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-56" />
                </div>
                <Skeleton className="h-9 w-28 rounded-ctrl" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
