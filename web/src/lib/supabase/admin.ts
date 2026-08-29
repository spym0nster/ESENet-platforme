import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — **server-only, bypasses RLS**. Used only
 * to resolve a user's email for outgoing notification emails (the `auth`
 * schema isn't reachable with the anon/authed key, and `profiles` has no
 * email column by design).
 *
 * Returns null when `SUPABASE_SERVICE_ROLE_KEY` isn't set, so callers stay
 * a no-op until you add the key (Project Settings → API → service_role) to
 * the env. Never import this into a client component.
 */
let admin: SupabaseClient | null = null;

/** True when the service-role key is available (server-side email lookups). */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export function createAdminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  if (!admin) {
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

/** Resolve emails for a set of profile ids via the admin API. Best-effort. */
export async function resolveUserEmails(
  ids: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const client = createAdminClient();
  if (!client || ids.length === 0) return out;

  await Promise.all(
    [...new Set(ids)].map(async (id) => {
      try {
        const { data, error } = await client.auth.admin.getUserById(id);
        if (!error && data.user?.email) out.set(id, data.user.email);
      } catch (err) {
        console.error("resolveUserEmails: getUserById failed for", id, err);
      }
    })
  );
  return out;
}
