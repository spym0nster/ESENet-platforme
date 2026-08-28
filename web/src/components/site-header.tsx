import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { unreadNotificationCount } from "@/lib/notifications";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let isCompany = false;
  let isAdmin = false;
  let isStudent = false;
  let unread = 0;
  if (supabase && user) {
    const [{ data: profile }, unreadCount] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      unreadNotificationCount(supabase, user.id),
    ]);
    isCompany = profile?.role === "company";
    isAdmin = profile?.role === "admin";
    isStudent = profile?.role === "student";
    unread = unreadCount;
  }

  return (
    // Fixed dark ground on purpose: the wordmark's "ESE" / "Talent Fair"
    // glyphs are near-white and only read on a dark surface, regardless of
    // whether the rest of the page is in light or dark mode.
    <header className="bg-[#0B0E36]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
        </Link>
        {/* py-3 on every link/button below isn't visual padding — text
            size and header height look about the same either way, since
            the row was already taller than the text alone. It exists
            purely to grow each link's own tap target to the ~40px
            minimum (confirmed live at 16px without it: text-xs with no
            padding of its own, relying entirely on the row's height
            around it, which a touch target doesn't get credit for). */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-wider text-[#B3ADD9]">
          <Link href="/opportunities" className="py-3 hover:text-white">
            Opportunities
          </Link>
          <Link href="/students" className="py-3 hover:text-white">
            Students
          </Link>
          <Link href="/feed" className="py-3 hover:text-white">
            Feed
          </Link>
          {isStudent && (
            <>
              <Link href="/profile" className="py-3 hover:text-white">
                My profile
              </Link>
              <Link href="/applications" className="py-3 hover:text-white">
                My applications
              </Link>
              <Link href="/saved" className="py-3 hover:text-white">
                Saved
              </Link>
            </>
          )}
          {isCompany && (
            <>
              <Link href="/company/profile" className="py-3 hover:text-white">
                My profile
              </Link>
              <Link href="/company/dashboard" className="py-3 hover:text-white">
                My company
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link href="/admin/companies" className="py-3 hover:text-white">
                Admin
              </Link>
              <Link href="/admin/reports" className="py-3 hover:text-white">
                Reports
              </Link>
            </>
          )}
          {user && (
            <Link
              href="/notifications"
              className="py-3 hover:text-white"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            >
              {unread > 0 ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-white">
                  🔔 {unread > 9 ? "9+" : unread}
                </span>
              ) : (
                <span aria-hidden>🔔</span>
              )}
            </Link>
          )}
          {user ? (
            <form action={signOut}>
              <button type="submit" className="py-3 hover:text-white">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="py-3 hover:text-white">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-4 py-3 text-white normal-case tracking-normal"
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
