"use client";

// Light by default (the site's brand look); the choice is remembered. The
// inline script in the layout applies it before paint, so there is no flash.
// Both icons are always rendered and CSS shows the right one, so the button
// needs no state and cannot mismatch on hydration.
export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("esn-theme", next);
    } catch {
      /* private mode: the choice just lasts for this visit */
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-snow transition-colors hover:border-white/50"
    >
      <svg viewBox="0 0 24 24" className="size-[18px] dark:hidden" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden size-[18px] dark:block" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
