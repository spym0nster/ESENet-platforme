"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import type { AppNotification, NotificationKind } from "@/types/database";

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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell({
  unread,
  recent,
}: {
  unread: number;
  recent: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const markedRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Opening the panel marks everything read (same behaviour as visiting
  // /notifications) — but the panel keeps highlighting what was unread for
  // this view. Fires at most once per mount.
  useEffect(() => {
    if (open && unread > 0 && !markedRef.current) {
      markedRef.current = true;
      void markAllNotificationsRead();
    }
  }, [open, unread]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="py-3 hover:text-white"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
      >
        {unread > 0 ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-white">
            🔔 {unread > 9 ? "9+" : unread}
          </span>
        ) : (
          <span aria-hidden>🔔</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-surface text-left normal-case tracking-normal shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="font-display text-sm font-bold text-text">
              Notifications
            </span>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="font-mono text-[11px] text-accent-2 hover:text-text"
            >
              See all →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              Nothing yet.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {recent.map((n) => {
                const body = (
                  <div className="flex gap-2.5 px-4 py-3">
                    <span className="text-base leading-none" aria-hidden>
                      {KIND_ICON[n.kind] ?? "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[11px] text-text-faint">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read_at && (
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-2"
                        aria-label="Unread"
                      />
                    )}
                  </div>
                );
                return (
                  <li key={n.id} className={n.read_at ? "" : "bg-accent2-soft/40"}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setOpen(false)}
                        className="block hover:bg-surface-alt"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
