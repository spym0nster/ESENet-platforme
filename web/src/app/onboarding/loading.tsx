import { Skeleton } from "@/components/ui";

/** The silhouette of a step: progress bar, a question, then form fields. */
export default function Loading() {
  return (
    <>
      <div className="mb-8">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="mt-3 h-3 w-2/3" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-11 w-full rounded-ctrl" />
        <Skeleton className="h-11 w-full rounded-ctrl" />
        <Skeleton className="h-11 w-1/2 rounded-ctrl" />
      </div>
      <div className="mt-8 flex justify-end">
        <Skeleton className="h-11 w-28 rounded-ctrl" />
      </div>
    </>
  );
}
