import { NextResponse, type NextRequest } from "next/server";

// Only the bare root needs a decision. Take whichever of French or English
// the browser lists first (an Arabic-first browser in Tunisia usually lists
// French next), falling back to English. Every other path already carries
// its locale, or 404s via dynamicParams = false.
export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept-language") ?? "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .find((tag) => tag.startsWith("fr") || tag.startsWith("en"));
  const locale = preferred?.startsWith("fr") ? "fr" : "en";
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: "/",
};
