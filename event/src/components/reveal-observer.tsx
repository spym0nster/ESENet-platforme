"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Content is visible by default. On mount, anything marked [data-reveal]
// that is still below the fold gets `is-pending` (it is off screen, so no
// flash), and rises in the first time it scrolls into view.
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          if (entry.isIntersecting) {
            el.classList.remove("is-pending");
            io.unobserve(el);
          } else if (!seen.has(el)) {
            el.classList.add("is-pending");
          }
          seen.add(el);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
