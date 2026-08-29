import Link from "next/link";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { unreadNotificationCount, fetchNotifications } from "@/lib/notifications";
import { NotificationBell } from "@/components/notification-bell";
import { signOut } from "@/app/actions/auth";

/**
 * The one header, rendered once in the root layout for every route. On a
 * fixed dark ground in both themes (`--header-bg`) — the wordmark only
 * reads there.
 */
export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let isCompany = false;
  let isAdmin = false;
  let isStudent = false;
  let unread = 0;
  let recentNotifications: Awaited<ReturnType<typeof fetchNotifications>> = [];
  if (supabase && user) {
    const [{ data: profile }, unreadCount, recent] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      unreadNotificationCount(supabase, user.id),
      fetchNotifications(supabase, user.id, 5),
    ]);
    isCompany = profile?.role === "company";
    isAdmin = profile?.role === "admin";
    isStudent = profile?.role === "student";
    unread = unreadCount;
    recentNotifications = recent;
  }

  return (
    <header className="bg-[color:var(--header-bg)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-wider">
          <NavLink href="/opportunities">Opportunities</NavLink>
          <NavLink href="/companies">Companies</NavLink>
          <NavLink href="/students">Students</NavLink>
          <NavLink href="/feed">Feed</NavLink>

          {isStudent && (
            <>
              <NavLink href="/profile">My profile</NavLink>
              <NavLink href="/applications">My applications</NavLink>
              <NavLink href="/saved">Saved</NavLink>
            </>
          )}
          {isCompany && (
            <>
              <NavLink href="/company/profile">My profile</NavLink>
              <NavLink href="/company/dashboard">My company</NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink href="/admin">Admin</NavLink>
              <NavLink href="/admin/reports">Reports</NavLink>
            </>
          )}

          {user && (
            <NotificationBell unread={unread} recent={recentNotifications} />
          )}
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="py-3 text-[color:var(--header-fg)] transition hover:text-white"
              >
                Sign out
              </button>
            </form>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <Link
                href="/signup"
                className="inline-flex min-h-9 items-center rounded-ctrl bg-accent px-4 font-sans text-xs font-semibold normal-case tracking-normal text-white transition hover:brightness-105 active:translate-y-px"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
