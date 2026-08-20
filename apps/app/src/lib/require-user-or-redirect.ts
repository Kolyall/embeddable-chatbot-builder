import { redirect } from "next/navigation";
import { requireUser, UnauthorizedError } from "@cbb/auth";

/**
 * Wraps requireUser() for Server Components/Server Actions: redirects to
 * /login instead of leaving an uncaught UnauthorizedError for an error
 * boundary to render. Use this everywhere under /workspace instead of
 * requireUser() directly.
 */
export async function requireUserOrRedirect() {
  try {
    return await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw err;
  }
}
