import { Skeleton } from "@/components/ui";

/** The silhouette of the edit-opportunity form. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-3 w-32" />
      <Skeleton className="mt-2 h-8 w-64" />

      <div className="mt-10 space-y-8">
        {[0, 1, 2].map((s) => (
          <div key={s} className="space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-11 w-full rounded-ctrl" />
            <Skeleton className="h-11 w-full rounded-ctrl" />
          </div>
        ))}
      </div>
    </div>
  );
}
