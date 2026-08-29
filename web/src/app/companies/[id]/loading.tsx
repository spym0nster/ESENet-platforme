import { Skeleton } from "@/components/ui";

/** The silhouette of the company page: banner, overlapping logo + name, tab strip. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Skeleton className="h-3 w-28" />

      <Skeleton className="mt-2 h-40 w-full rounded-card" />

      <div className="-mt-10 px-1">
        <Skeleton className="size-20 rounded-2xl" />
      </div>

      <Skeleton className="mt-4 h-8 w-56" />
      <Skeleton className="mt-2 h-3 w-40" />

      <div className="mt-8 flex gap-6 border-b border-border pb-3">
        {["w-14", "w-16", "w-14", "w-16"].map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w}`} />
        ))}
      </div>

      <div className="mt-8 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
