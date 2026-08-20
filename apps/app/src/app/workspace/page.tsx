import { redirect } from "next/navigation";
import { getDb, workspaces } from "@cbb/db";
import { eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";

/**
 * Single-owner workspace model: one workspace per account. This route just
 * dispatches to the right place — create one if none exists yet, otherwise
 * go straight to it.
 */
export default async function WorkspaceIndexPage() {
  const user = await requireUserOrRedirect();

  const db = getDb();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user.id))
    .limit(1);

  if (!workspace) {
    redirect("/workspace/new");
  }

  redirect(`/workspace/${workspace.id}`);
}
