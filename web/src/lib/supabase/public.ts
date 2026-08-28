import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A cookie-less Supabase client for **public, unauthenticated reads only**
 * (landing page stats, directories). Because it never touches `cookies()`,
 * a page that uses only this client can stay statically rendered / ISR-
 * cached instead of being forced dynamic per-request.
 *
 * Never use this where the result depends on who's signed in — it always
 * runs as the `anon` role. For anything auth-aware use
 * `lib/supabase/server.ts`.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
