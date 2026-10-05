"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

type Result = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Run a server action with pending state, a toast for the outcome, and a router refresh on success.
 * Returns the result so callers can map fieldErrors onto their form.
 */
export function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <R extends Result>(fn: () => Promise<R>, opts: { success?: string; refresh?: boolean; onSuccess?: (r: R) => void } = {}) =>
      new Promise<R>((resolve) => {
        startTransition(async () => {
          const res = await fn();
          if (res.ok) {
            const msg = res.message ?? opts.success;
            if (msg) toast.success(msg);
            opts.onSuccess?.(res);
            if (opts.refresh !== false) router.refresh();
          } else {
            toast.error(res.error);
          }
          resolve(res);
        });
      }),
    [router],
  );

  return { run, pending };
}
