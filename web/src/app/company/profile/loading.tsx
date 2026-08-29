import { Skeleton } from "@/components/ui";

/** The silhouette of the company profile editor. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-2 h-8 w-56" />

      <div className="mt-10 space-y-6">
        <Skeleton className="h-16 w-full rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>

      <div className="mt-10 space-y-4">
        <Skeleton className="h-11 w-full rounded-ctrl" />
        <Skeleton className="h-24 w-full rounded-ctrl" />
        <Skeleton className="h-10 w-32 rounded-ctrl" />
      </div>
    </div>
  );
}
