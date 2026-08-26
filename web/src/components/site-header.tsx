import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const user = configured ? (await (await createClient()).auth.getUser()).data.user : null;

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
