import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
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
        <LinkButton href="/opportunities" variant="primary">
          Browse opportunities
        </LinkButton>
        <LinkButton href="/" variant="secondary">
          Go home
        </LinkButton>
      </div>
    </div>
  );
}
