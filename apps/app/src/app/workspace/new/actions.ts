"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, workspaces } from "@cbb/db";
import { eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import type { ActionState } from "@/lib/action-state";

const createWorkspaceSchema = z.object({
  name: z
    .string({ required_error: "Workspace name is required.", invalid_type_error: "Workspace name is required." })
    .trim()
    .min(1, "Workspace name is required.")
    .max(100, "Workspace name must be 100 characters or fewer."),
});

export async function createWorkspace(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUserOrRedirect();
  const db = getDb();

  // Single-owner, one workspace per account — never let a second one get
  // created, whatever the client sent.
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user.id))
    .limit(1);
  if (existing) {
    redirect(`/workspace/${existing.id}`);
  }

  const parsed = createWorkspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid workspace name." };
  }
  const { name } = parsed.data;

  const [created] = await db
    .insert(workspaces)
    .values({ ownerId: user.id, name, plan: "free" })
    .returning();

  if (!created) {
    return { error: "Failed to create workspace. Please try again." };
  }

  redirect(`/workspace/${created.id}`);
}
