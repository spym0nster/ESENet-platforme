export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
      {action && <div className="mt-6 inline-block">{action}</div>}
    </div>
  );
}
