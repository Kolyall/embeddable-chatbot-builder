import { refreshSupabaseSession } from "@cbb/auth";
import type { NextRequest } from "next/server";

// Next.js 16 renamed middleware.ts -> proxy.ts (same mechanics, new export
// name). This only refreshes the Supabase session cookie; actual auth
// enforcement happens per-route via requireUser()/requireAdmin() in
// @cbb/auth, since proxy/middleware coverage can silently drop for Server
// Function calls on a route a matcher change forgot about.
export function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: [
    // `widget` covers both /widget-loader.js and /widget-demo.html (static
    // assets) and every /widget/[chatbotId]* route (the public, unauthenticated
    // embed page + its chat API) — none of these carry/need a Supabase
    // session, so there's no reason to pay for a cookie refresh on them.
    "/((?!_next/static|_next/image|favicon.ico|widget).*)",
  ],
};
