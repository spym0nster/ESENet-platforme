import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate (per Next.js guidance): no Auth.js session cookie → bounce to /admin/login
 * before rendering anything. This only checks the cookie *exists*. The authoritative check —
 * valid signed JWT, user still active, correct role — runs server-side on every page, action
 * and route handler via requireStaff() / requireAdmin() / actor().
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

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
