import Link from "next/link";
import { Logo } from "@/components/logo";
import { HeaderNav } from "@/components/header-nav";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { resolveCompanyId } from "@/lib/company";
import { unreadNotificationCount, fetchNotifications } from "@/lib/notifications";

/**
 * The one header, rendered once in the root layout for every route. On a
 * fixed dark ground in both themes (`--header-bg`) — the wordmark only
 * reads there. The nav itself is one client island (HeaderNav).
 */
export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let role: "student" | "company" | "admin" | null = null;
  let unread = 0;
  let recent: Awaited<ReturnType<typeof fetchNotifications>> = [];
  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let companyName: string | null = null;
  const email: string | null = user?.email ?? null;

  if (supabase && user) {
    const [{ data: profile }, unreadCount, recentRows] = await Promise.all([
      supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", user.id)
        .single(),
      unreadNotificationCount(supabase, user.id),
      fetchNotifications(supabase, user.id, 5),
    ]);
    role =
      profile?.role === "student" ||
      profile?.role === "company" ||
      profile?.role === "admin"
        ? profile.role
        : null;
    displayName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    unread = unreadCount;
    recent = recentRows;

    if (role === "company") {
      const companyId = await resolveCompanyId(supabase, user.id);
      if (companyId) {
        const { data: company } = await supabase
          .from("companies")
          .select("company_name")
          .eq("profile_id", companyId)
          .maybeSingle();
        companyName = company?.company_name ?? null;
      }
    }
  }

  return (
    <header className="bg-[color:var(--header-bg)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
        </Link>
        <HeaderNav
          role={role}
          signedIn={Boolean(user)}
          unread={unread}
          recent={recent}
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          companyName={companyName}
        />
      </div>
    </header>
  );
}
