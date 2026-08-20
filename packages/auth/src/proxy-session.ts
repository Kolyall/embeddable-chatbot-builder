import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request. Call this from
 * each app's proxy.ts (Next.js 16 renamed middleware.ts -> proxy.ts — see
 * apps/app/src/proxy.ts / apps/admin/src/proxy.ts). This only refreshes
 * cookies; it does NOT redirect unauthenticated users — do that per-route
 * with requireUser()/requireAdmin() from ./server, since proxy/middleware
 * is documented as unreliable for Server Function calls (see Next.js
 * proxy.js docs: "always verify auth inside each Server Function").
 */
export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    // See createSupabaseServerClient in ./server.ts for why this is
    // SUPABASE_URL (runtime env var) and not NEXT_PUBLIC_SUPABASE_URL
    // (baked into the bundle at build time, must stay browser-reachable).
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}
