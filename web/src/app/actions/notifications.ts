"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marks every unread notification for the current user read. Used both as a
 * `<form action>` (the "Mark all read" button) and fired once on mount by
 * the /notifications page — so it returns void.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("markAllNotificationsRead failed:", error);
    return;
  }

  // Only refresh the header bell (rendered in the root layout). Deliberately
  // NOT revalidating /notifications: this runs on page mount, and we want
  // the just-opened list to keep highlighting what was unread for this view
  // — it renders all-read on the next visit.
  revalidatePath("/", "layout");
}
