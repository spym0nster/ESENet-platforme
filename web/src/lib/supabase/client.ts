import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components.
 * Reads the public URL/anon key — safe to expose to the browser.
 *
 * Not typed against `Database` yet — this project's schema is still hand
 * written (see supabase/schema.sql). Once the Supabase project is linked,
 * run `npx supabase gen types typescript --project-id <id>` and pass the
 * generated type as the generic here and in server.ts for full query
 * type-safety.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
