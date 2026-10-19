import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate (per Next.js guidance): no Auth.js session cookie → bounce to /admin/login
 * before rendering anything. This only checks the cookie *exists*. The authoritative check —
 * valid signed JWT, user still active, correct role — runs server-side on every page, action
 * and route handler via requireStaff() / requireAdmin() / actor().
 */
/** Staff auth pages reachable while signed out — never gated behind a session cookie. */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  const hasSession = request.cookies.getAll().some((c) => /^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(c.name));
  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL("/admin/login", request.url);
  if (pathname !== "/admin") url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/cv/:path*", "/api/export/:path*"],
};
