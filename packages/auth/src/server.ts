import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getDb, profiles } from "@cbb/db";
import { eq } from "drizzle-orm";

/**
 * Server Component / Route Handler Supabase client. Cookie writes silently
 * no-op when called from a Server Component render (Next.js only allows
 * setting cookies from a Server Action or Route Handler) — that's fine here
 * since session refresh already happens in proxy.ts (see apps/app/src/proxy.ts).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    // Server-side calls use SUPABASE_URL (a plain runtime env var, NOT
    // inlined at build time), not NEXT_PUBLIC_SUPABASE_URL. The public
    // var is baked into the client bundle at build time and must be a
    // browser-reachable address (e.g. http://localhost:8000 in local dev);
    // when this server runs in a container it instead needs the
    // container-network address of the Supabase gateway (e.g.
    // http://api-gw:8000), which can only be supplied as a live env var,
    // not a build-time constant. SUPABASE_URL is set to the same value as
    // NEXT_PUBLIC_SUPABASE_URL for host-run dev, so this is a no-op there.
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — ignore, proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/** Returns the current Supabase auth user, or null if not logged in. */
export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Throws UnauthorizedError if not logged in — use at the top of every
 * Server Component/Route Handler that needs a signed-in user. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Throws UnauthorizedError/ForbiddenError — use at the top of every
 * apps/admin Server Component/Route Handler. */
export async function requireAdmin() {
  const user = await requireUser();
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!profile?.isAdmin) throw new ForbiddenError();
  return { user, profile };
}
