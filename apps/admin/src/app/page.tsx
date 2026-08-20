import { redirect } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/require-admin-or-redirect";

/**
 * requireAdminOrRedirect() already implements the exact routing this page
 * needs: UnauthorizedError -> /login, ForbiddenError (logged in, not admin)
 * -> /forbidden (a clear message, never a confusing bounce back to /login).
 * Success just lands here on the workspaces list.
 */
export default async function Home() {
  await requireAdminOrRedirect();
  redirect("/workspaces");
}
