import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Card, Badge, EmptyState } from "@/components/ui";
import { ResolveReportButtons } from "@/components/resolve-report-buttons";
import { RemovePostButton, RemoveCommentButton } from "@/components/post-actions";

const REASON_LABEL: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate content",
  fake_information: "Fake information",
  recruitment_abuse: "Recruitment abuse",
  other: "Other",
};

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  reporter: { full_name: string } | null;
  post: { id: string; body: string; removed_at: string | null } | null;
  comment: { id: string; body: string; removed_at: string | null } | null;
};

export const metadata = {
  title: "Content reports",
  robots: { index: false },
};

export default async function AdminReportsPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase } = await requireAdminUser("/admin/reports");

  const { data, error } = await supabase
    .from("content_reports")
    .select(
      `id, reason, details, status, created_at,
       reporter:profiles!content_reports_reporter_id_fkey(full_name),
       post:posts(id, body, removed_at),
       comment:post_comments(id, body, removed_at)`
    )
    .order("created_at", { ascending: false });

  const reports = (data ?? []) as unknown as ReportRow[];
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status !== "open");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin"
        className="inline-block py-2 font-mono text-xs text-accent-2 hover:text-text"
      >
        ← Admin overview
      </Link>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent-2">Admin</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Content reports</h1>
      <p className="mt-2 text-text-muted">
        Reports filed by students and companies against feed posts or comments.
      </p>

      {error && <p className="mt-8 text-sm text-magenta">Couldn&apos;t load reports: {error.message}</p>}

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">Open</h2>
        {open.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Nothing open" body="No unresolved reports right now." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {open.map((r) => (
              <li key={r.id}>
                <Card className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-semibold">{REASON_LABEL[r.reason] ?? r.reason}</span>{" "}
                      <span className="text-text-muted">
                        reported by {r.reporter?.full_name ?? "someone"}
                      </span>
                    </p>
                    <Badge tone="neutral">{r.post ? "Post" : "Comment"}</Badge>
                  </div>
                  {r.details && <p className="text-sm text-text-muted">&ldquo;{r.details}&rdquo;</p>}
                  <div className="rounded-ctrl border border-border bg-surface-alt p-3 text-sm text-text-muted">
                    {r.post?.body ?? r.comment?.body ?? "(content no longer available)"}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-3">
                      {r.post && !r.post.removed_at && <RemovePostButton postId={r.post.id} />}
                      {r.comment && !r.comment.removed_at && (
                        <RemoveCommentButton commentId={r.comment.id} />
                      )}
                      {(r.post?.removed_at || r.comment?.removed_at) && (
                        <span className="font-mono text-xs text-text-faint">Already removed</span>
                      )}
                    </div>
                    <ResolveReportButtons reportId={r.id} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Resolved / dismissed
        </h2>
        {resolved.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">None yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {resolved.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-text-muted">
                    {REASON_LABEL[r.reason] ?? r.reason} — {r.post ? "post" : "comment"}
                  </p>
                  <Badge tone={r.status === "resolved" ? "violet" : "neutral"}>{r.status}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
