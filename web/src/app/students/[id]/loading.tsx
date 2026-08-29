import { Skeleton } from "@/components/ui";

/** The silhouette of a student profile: banner, overlapping avatar + name, then the timeline. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Skeleton className="h-3 w-24" />

      <Skeleton className="mt-2 h-40 w-full rounded-card" />

      <div className="-mt-10 px-1">
        <Skeleton className="size-20 rounded-full" />
      </div>

      <Skeleton className="mt-4 h-8 w-52" />
      <Skeleton className="mt-2 h-3 w-64" />
      <Skeleton className="mt-3 h-3 w-32" />

      <div className="mt-10 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2 border-l-2 border-border pl-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="space-y-2 border-l-2 border-border pl-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
    </div>
  );
}
