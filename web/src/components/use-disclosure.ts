"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The shared open/close behaviour for the header's dropdown-or-sheet menus
 * (the account menu and the mobile nav sheet). One implementation so the two
 * can't drift:
 *  - click toggles; Escape closes and returns focus to the trigger
 *  - a click outside the wrapper closes it
 *  - Arrow Up/Down cycle the focusable items
 *  - Tab / Shift+Tab wrap at the ends — focus is trapped while open
 *  - opening moves focus to the first item
 */
export function useDisclosure() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      [
        ...(panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        ) ?? []),
      ];

    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      const arr = focusables();
      if (!arr.length) return;
      const active = document.activeElement as HTMLElement;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = arr.indexOf(active);
        const next =
          e.key === "ArrowDown"
            ? arr[(idx + 1) % arr.length]
            : arr[(idx - 1 + arr.length) % arr.length];
        next.focus();
      } else if (e.key === "Tab") {
        if (e.shiftKey && active === arr[0]) {
          e.preventDefault();
          arr[arr.length - 1].focus();
        } else if (!e.shiftKey && active === arr[arr.length - 1]) {
          e.preventDefault();
          arr[0].focus();
        }
      }
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    focusables()[0]?.focus();

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return { open, setOpen, close, wrapRef, triggerRef, panelRef } as const;
}
