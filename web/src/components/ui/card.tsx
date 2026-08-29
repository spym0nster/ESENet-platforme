/**
 * Surface primitive. Depth on the dark ground is `--surface` over `--bg`, a
 * hairline `--border`, and the `--lift` inset top-highlight — not a shadow.
 *
 * `interactive` is for a card that is *itself* a link/button (the whole
 * thing is one tap target). It rises toward the pointer and blooms a soft
 * violet `--glow` on hover. A static card that merely *contains* controls
 * (a feed post, an applicant row) must stay `interactive={false}` so it
 * doesn't twitch while you use what's inside it.
 */
export function Card({
  interactive = false,
  className = "",
  children,
}: {
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 [box-shadow:var(--lift)] ${
        interactive
          ? "transition duration-150 ease-out hover:-translate-y-[3px] hover:[box-shadow:var(--glow)] motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
