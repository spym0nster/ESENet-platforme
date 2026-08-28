import Link from "next/link";

/**
 * The only place /privacy, /terms, and /cookies are linked from besides
 * the signup form's own consent line — without this they'd be unreachable
 * pages, present in the codebase but undiscoverable in the product.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-6 font-mono text-xs text-text-faint">
        <p>© {new Date().getFullYear()} ESENet</p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/privacy" className="py-2 hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="py-2 hover:text-text">
            Terms
          </Link>
          <Link href="/cookies" className="py-2 hover:text-text">
            Cookies
          </Link>
        </nav>
      </div>
    </footer>
  );
}
