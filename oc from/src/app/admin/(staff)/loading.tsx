import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-3 border-b border-line pb-6">
        <Skeleton className="h-3 w-32 bg-surface-2" />
        <Skeleton className="h-9 w-72 bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 bg-surface p-5">
            <Skeleton className="h-3 w-20 bg-surface-2" />
            <Skeleton className="h-8 w-14 bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="space-y-2 border border-line bg-surface p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
