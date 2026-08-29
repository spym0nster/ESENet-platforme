"use client";

import { useState } from "react";

/**
 * Copy-link + LinkedIn share for a public page. `path` is the app-relative
 * path (e.g. `/opportunities/abc`); the absolute URL is resolved from
 * `window.location.origin` at click time, so it's correct on any deployment
 * and there's no server/client markup to mismatch.
 */
export function ShareButton({ path, label = "Share" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const absolute = () => window.location.origin + path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(absolute());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions / insecure context) — no-op.
    }
  }

  function shareLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        absolute()
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <span className="inline-flex items-center gap-3 font-mono text-xs">
      <button type="button" onClick={copy} className="text-accent-2 hover:text-text">
        {copied ? "Link copied" : label}
      </button>
      <button
        type="button"
        onClick={shareLinkedIn}
        className="text-accent-2 hover:text-text"
      >
        Share on LinkedIn
      </button>
    </span>
  );
}
