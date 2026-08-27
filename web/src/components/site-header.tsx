import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let isCompany = false;
  let isAdmin = false;
  let isStudent = false;
  if (supabase && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isCompany = profile?.role === "company";
    isAdmin = profile?.role === "admin";
    isStudent = profile?.role === "student";
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
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider text-[#B3ADD9]">
          <Link href="/opportunities" className="hover:text-white">
            Opportunities
          </Link>
          <Link href="/feed" className="hover:text-white">
            Feed
          </Link>
          {isStudent && (
            <>
              <Link href="/profile" className="hover:text-white">
                My profile
              </Link>
              <Link href="/applications" className="hover:text-white">
                My applications
              </Link>
              <Link href="/saved" className="hover:text-white">
                Saved
              </Link>
            </>
          )}
          {isCompany && (
            <>
              <Link href="/company/profile" className="hover:text-white">
                My profile
              </Link>
              <Link href="/company/dashboard" className="hover:text-white">
                My company
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link href="/admin/companies" className="hover:text-white">
                Admin
              </Link>
              <Link href="/admin/reports" className="hover:text-white">
                Reports
              </Link>
            </>
          )}
          {user ? (
            <form action={signOut}>
              <button type="submit" className="hover:text-white">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-4 py-2 text-white normal-case tracking-normal"
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
