/**
 * A titled block inside a page — a real section heading (Poppins
 * `text-lg font-semibold`, per `UX_ELEVATION.md` §3), then its content.
 *
 * Not for a *data label* above a page title or over a stat strip — that's
 * the mono eyebrow (`font-mono text-xs uppercase tracking-widest
 * text-text-muted`), rendered inline, not through this.
 */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
