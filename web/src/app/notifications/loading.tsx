import { Skeleton } from "@/components/ui";

/** The silhouette of the notifications page: heading, then a stack of rows. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-8 w-40" />

      <ul className="mt-8 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <li
            key={i}
            className="rounded-card border border-border bg-surface p-4 [box-shadow:var(--lift)]"
          >
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-3/4" />
            <Skeleton className="mt-2 h-3 w-24" />
          </li>
        ))}
      </ul>
    </div>
  );
}
