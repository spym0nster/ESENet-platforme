import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** Best-effort client IP (Vercel sets x-forwarded-for / x-real-ip). */
export async function clientIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** One-way hash so raw IPs / emails never land in the rate-limit table. */
export function hashKey(...parts: string[]) {
  const salt = process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`${salt}:${parts.join(":")}`).digest("hex").slice(0, 40);
}
