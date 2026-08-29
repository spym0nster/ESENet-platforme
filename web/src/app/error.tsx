"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console + (in prod) Vercel logs via the digest.
    console.error("Route error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-magenta">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl font-extrabold">
        We hit an unexpected error
      </h1>
      <p className="mt-3 text-text-muted">
        Try again in a moment. If it keeps happening, let the ESENet team know
        {error.digest ? ` (ref ${error.digest})` : ""}.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-accent px-5 py-2.5 font-mono text-sm text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-5 py-2.5 font-mono text-sm text-text-muted hover:text-text"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
