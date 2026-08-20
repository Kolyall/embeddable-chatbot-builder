import { redirect } from "next/navigation";
import { requireAdmin, ForbiddenError, UnauthorizedError } from "@cbb/auth";

/**
 * Wraps requireAdmin() for Server Components/Server Actions in apps/admin:
 * redirects to /login if not authenticated, or to /forbidden if
 * authenticated but not an admin, instead of leaving an uncaught error for
 * an error boundary to render. Use this at the top of every Server
 * Component/Server Action in this app instead of requireAdmin() directly —
 * there is no "logged in but not admin" partial access anywhere in
 * apps/admin.
 */
export async function requireAdminOrRedirect() {
  try {
    return await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login");
    }
    if (err instanceof ForbiddenError) {
      redirect("/forbidden");
    }
    throw err;
  }
}
