"use client";

import { useEffect, useRef } from "react";
import { markAllNotificationsRead } from "@/app/actions/notifications";

/**
 * Fires once when the /notifications page mounts: marks everything read so
 * the header bell clears. The list itself keeps its unread highlighting for
 * the current view (the action doesn't revalidate this route) — that's
 * intentional, so you can still see what was new.
 */
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !hasUnread) return;
    done.current = true;
    void markAllNotificationsRead();
  }, [hasUnread]);
  return null;
}
