import { getSessionUser } from "@cbb/auth";
import { LogoutButton, ParrotMark } from "@cbb/ui";

/**
 * Reached when requireAdminOrRedirect() catches a ForbiddenError: the visitor
 * is a logged-in Supabase user, just not one with profiles.isAdmin = true.
 * Deliberately does NOT call requireAdmin()/requireAdminOrRedirect() itself
 * (that would just redirect right back here) and is not gated by anything —
 * it's the one page in this app any logged-in user can reach.
 */
export default async function ForbiddenPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <ParrotMark size={36} className="opacity-70 grayscale" />
      <h1 className="font-display text-2xl font-semibold text-foreground">
        You don&apos;t have access to this area
      </h1>
      <p className="text-sm text-muted-foreground">
        {user?.email ? <>Signed in as {user.email}. </> : null}
        This admin console is restricted to instance operators. If you believe this is a mistake,
        contact whoever manages this instance.
      </p>
      <LogoutButton />
    </div>
  );
}
