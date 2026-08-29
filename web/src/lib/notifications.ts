import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppNotification, NotificationKind } from "@/types/database";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { renderNotificationEmail } from "@/lib/email-templates";
import { isAdminConfigured, resolveUserEmails } from "@/lib/supabase/admin";

type NotifyInput = {
  recipientId?: string;
  recipientIds?: string[];
  actorId?: string | null;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  link?: string | null;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esenet-platforme.vercel.app";

/**
 * Best-effort notification insert, called from the server actions that
 * already perform the underlying mutation. Never throws and never returns
 * an error: a notification failing must not roll back or block the action
 * that triggered it (an application still submits even if pinging the
 * company fails). Dedups recipients and drops the actor from the list —
 * you're never notified of your own action.
 *
 * When email is wired up (RESEND_API_KEY + SUPABASE_SERVICE_ROLE_KEY), each
 * recipient also gets the same notification as an email — sent via
 * `after()` so it never adds latency to the triggering action, and still
 * fully best-effort.
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

  const recipientIds = [...ids];

  const rows = recipientIds.map((recipient_id) => ({
    recipient_id,
    actor_id: input.actorId ?? null,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("notify failed:", input.kind, error);

  // Email mirror — only if a provider + a way to resolve recipient emails
  // are both configured. Deferred past the response, never blocks.
  if (isEmailConfigured() && isAdminConfigured()) {
    const link = input.link
      ? `${siteUrl}${input.link.startsWith("/") ? "" : "/"}${input.link}`
      : null;
    try {
      after(async () => {
        try {
          const emails = await resolveUserEmails(recipientIds);
          if (emails.size === 0) return;
          const { subject, html, text } = renderNotificationEmail({
            title: input.title,
            body: input.body ?? null,
            url: link,
          });
          await Promise.all(
            [...emails.values()].map((to) =>
              sendEmail({ to, subject, html, text })
            )
          );
        } catch (err) {
          console.error("notify: email mirror failed:", input.kind, err);
        }
      });
    } catch (err) {
      // `after()` outside a request scope — shouldn't happen (notify is only
      // called from server actions), but never let it break the caller.
      console.error("notify: could not schedule email mirror:", err);
    }
  }
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
