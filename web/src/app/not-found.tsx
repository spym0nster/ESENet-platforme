import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-2">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-extrabold">
        This page isn&rsquo;t here
      </h1>
      <p className="mt-3 text-text-muted">
        The link may be broken, or the opportunity, company or post may have
        been removed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/opportunities"
          className="rounded-md bg-accent px-5 py-2.5 font-mono text-sm text-white"
        >
          Browse opportunities
        </Link>
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
