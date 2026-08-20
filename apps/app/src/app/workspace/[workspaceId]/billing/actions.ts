"use server";

import { redirect } from "next/navigation";
import { getDb, workspaces } from "@cbb/db";
import { eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedWorkspace } from "@/lib/workspace-access";

/**
 * Fully mocked billing (Decision 19) — no Stripe, no payment flow. Flips
 * `workspaces.plan` directly.
 */
export async function setWorkspacePlan(workspaceId: string, plan: "free" | "pro"): Promise<void> {
  const user = await requireUserOrRedirect();
  const workspace = await getOwnedWorkspace(workspaceId, user.id);

  const db = getDb();
  await db.update(workspaces).set({ plan }).where(eq(workspaces.id, workspace.id));

  redirect(`/workspace/${workspace.id}/billing`);
}
