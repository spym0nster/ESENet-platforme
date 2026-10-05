import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres, so it holds across serverless instances.
 * Returns true when the call is allowed. Fails *open* if the DB is unreachable — the caller's
 * own write fails anyway in that case, and the limiter must never be the outage.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds}::int) THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds}::int) THEN now()
          ELSE "RateLimit"."windowStart"
        END
      RETURNING "count"`;
    return (rows[0]?.count ?? 0) <= limit;
  } catch (err) {
    console.error("[rate-limit] failed open", err);
    return true;
  }
}

/** Housekeeping — drop windows older than a day. Called opportunistically. */
export async function pruneRateLimits() {
  try {
    await db.$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < now() - interval '1 day'`;
  } catch (err) {
    console.error("[rate-limit] prune failed", err);
  }
}
