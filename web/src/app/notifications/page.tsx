import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EmptyState } from "@/components/ui";
import { fetchNotifications } from "@/lib/notifications";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
import type { NotificationKind } from "@/types/database";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const KIND_ICON: Record<NotificationKind, string> = {
  application_received: "📥",
  application_status_changed: "📣",
  application_withdrawn: "↩️",
  join_request_received: "🙋",
  join_request_approved: "✅",
  join_request_declined: "🚫",
  ownership_transfer_proposed: "👑",
  post_comment: "💬",
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function NotificationsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const notifications = await fetchNotifications(supabase, user.id);
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <MarkNotificationsRead hasUnread={hasUnread} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
            Notifications
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">
            What&rsquo;s new
          </h1>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="py-2 font-mono text-xs text-text-muted hover:text-text"
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing yet"
            body="Application updates, join requests and replies to your posts will show up here."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {notifications.map((n) => {
            const inner = (
              <div
                className={`flex gap-3 rounded-lg border p-4 ${
                  n.read_at
                    ? "border-border bg-surface"
                    : "border-accent-2/40 bg-accent2-soft/40"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {KIND_ICON[n.kind] ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-text-muted">{n.body}</p>
                  )}
                  <p className="mt-1 font-mono text-xs text-text-faint">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.read_at && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-2" aria-label="Unread" />
                )}
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block transition hover:opacity-90">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
