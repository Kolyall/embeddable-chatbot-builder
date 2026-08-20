"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, workspaces, profiles, chatbots, documents } from "@cbb/db";
import { and, eq, inArray } from "drizzle-orm";
import { requireAdminOrRedirect } from "@/lib/require-admin-or-redirect";
import { getServiceRoleClient, DOCUMENTS_BUCKET } from "@/lib/service-role-client";

/**
 * This IS the entire billing-override mechanism for the whole product —
 * billing is fully mocked, there is no Stripe anywhere. Flips
 * workspaces.plan directly. Named per-target ('setWorkspacePlanToPro' /
 * 'setWorkspacePlanToFree') and bound with the workspace id at the call
 * site so each button in the UI is unambiguous about what it does.
 */
async function setWorkspacePlan(workspaceId: string, plan: "free" | "pro"): Promise<void> {
  await requireAdminOrRedirect();

  const db = getDb();
  await db.update(workspaces).set({ plan }).where(eq(workspaces.id, workspaceId));

  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath("/workspaces");
}

export async function setWorkspacePlanToPro(workspaceId: string): Promise<void> {
  await setWorkspacePlan(workspaceId, "pro");
}

export async function setWorkspacePlanToFree(workspaceId: string): Promise<void> {
  await setWorkspacePlan(workspaceId, "free");
}

/** Grants/revokes access to apps/admin itself for a given user. */
export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
  const { profile } = await requireAdminOrRedirect();

  // Never let an operator remove their own admin access from this button —
  // that would lock them out of the console with no self-serve way back in.
  if (userId === profile.id && !isAdmin) {
    return;
  }

  const db = getDb();
  await db.update(profiles).set({ isAdmin }).where(eq(profiles.id, userId));

  revalidatePath(`/workspaces`);
}

/**
 * Permanently deletes a customer's account: the Supabase Auth user, which
 * cascades (via DB foreign keys) through profiles -> workspaces -> chatbots
 * -> documents/document_chunks/widget_rate_limit. Only Storage objects for
 * their uploaded files need explicit cleanup first — Postgres FKs can't
 * reach Supabase Storage.
 */
export async function deleteWorkspaceOwner(workspaceId: string): Promise<void> {
  const { profile } = await requireAdminOrRedirect();

  const db = getDb();
  const [workspace] = await db
    .select({ id: workspaces.id, ownerId: workspaces.ownerId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!workspace) return;

  // Same self-lockout guard as setUserAdmin — an operator can't delete their
  // own account from this button.
  if (workspace.ownerId === profile.id) return;

  const ownedWorkspaces = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerId, workspace.ownerId));
  const workspaceIds = ownedWorkspaces.map((w) => w.id);

  const ownedChatbots =
    workspaceIds.length > 0
      ? await db.select({ id: chatbots.id }).from(chatbots).where(inArray(chatbots.workspaceId, workspaceIds))
      : [];
  const chatbotIds = ownedChatbots.map((c) => c.id);

  if (chatbotIds.length > 0) {
    const fileDocuments = await db
      .select({ storagePath: documents.storagePath })
      .from(documents)
      .where(and(inArray(documents.chatbotId, chatbotIds), eq(documents.kind, "file")));
    const storagePaths = fileDocuments
      .map((doc) => doc.storagePath)
      .filter((path): path is string => path !== null);

    if (storagePaths.length > 0) {
      const supabase = getServiceRoleClient();
      await supabase.storage.from(DOCUMENTS_BUCKET).remove(storagePaths);
    }
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.auth.admin.deleteUser(workspace.ownerId);
  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  redirect("/workspaces");
}
