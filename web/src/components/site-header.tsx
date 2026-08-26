import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const user = configured ? (await (await createClient()).auth.getUser()).data.user : null;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-text-muted">
          <Link href="/opportunities" className="hover:text-text">
            Opportunities
          </Link>
          {user ? (
            <form action={signOut}>
              <button type="submit" className="hover:text-text">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="hover:text-text">
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
