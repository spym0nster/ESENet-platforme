import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Wrap every staff server action body. Converts auth failures and unexpected errors into a
 * friendly result — raw database errors never reach the browser (they're logged server-side).
 */
export async function guarded<T>(name: string, fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.error(`[action:${name}]`, err);
    return { ok: false, error: "Something went wrong. Nothing was changed — please try again." };
  }
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function invalid<T = never>(error: ZodError): ActionResult<T> {
  return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(error) };
}
