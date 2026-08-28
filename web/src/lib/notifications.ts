import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppNotification, NotificationKind } from "@/types/database";

type NotifyInput = {
  recipientId?: string;
  recipientIds?: string[];
  actorId?: string | null;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  link?: string | null;
};

/**
 * Best-effort notification insert, called from the server actions that
 * already perform the underlying mutation. Never throws and never returns
 * an error: a notification failing must not roll back or block the action
 * that triggered it (an application still submits even if pinging the
 * company fails). Dedups recipients and drops the actor from the list —
 * you're never notified of your own action.
 */
export async function notify(
  supabase: SupabaseClient,
  input: NotifyInput
): Promise<void> {
  const ids = new Set<string>();
  if (input.recipientId) ids.add(input.recipientId);
  for (const id of input.recipientIds ?? []) ids.add(id);
  if (input.actorId) ids.delete(input.actorId);
  if (ids.size === 0) return;

  const rows = [...ids].map((recipient_id) => ({
    recipient_id,
    actor_id: input.actorId ?? null,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("notify failed:", input.kind, error);
}

/**
 * Every profile that acts for a company (owner + members). The backfill in
 * migration 0004 gives every company an explicit 'owner' company_members
 * row, so this one query covers everyone — no need to also union in
 * companies.profile_id.
 */
export async function companyActorIds(
  supabase: SupabaseClient,
  companyId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("company_members")
    .select("profile_id")
    .eq("company_id", companyId);
  return (data ?? []).map((r) => r.profile_id as string);
}

export async function unreadNotificationCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 50
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchNotifications failed:", error);
    return [];
  }
  return (data ?? []) as AppNotification[];
}
