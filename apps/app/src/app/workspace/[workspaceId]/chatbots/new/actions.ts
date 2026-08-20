"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, chatbots, PLAN_LIMITS } from "@cbb/db";
import { eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedWorkspace } from "@/lib/workspace-access";
import type { ActionState } from "@/lib/action-state";

const createChatbotSchema = z.object({
  name: z
    .string({ required_error: "Chatbot name is required.", invalid_type_error: "Chatbot name is required." })
    .trim()
    .min(1, "Chatbot name is required.")
    .max(100, "Chatbot name must be 100 characters or fewer."),
});

export async function createChatbot(
  workspaceId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUserOrRedirect();
  const workspace = await getOwnedWorkspace(workspaceId, user.id);

  const db = getDb();

  // Real enforcement point — never trust the "disabled" button in the UI.
  const existing = await db.select().from(chatbots).where(eq(chatbots.workspaceId, workspace.id));
  const limit = PLAN_LIMITS[workspace.plan].maxChatbots;
  if (existing.length >= limit) {
    return {
      error: `The ${workspace.plan === "pro" ? "Pro" : "Free"} plan is limited to ${limit} chatbot${limit === 1 ? "" : "s"}. Upgrade to Pro for more.`,
    };
  }

  const parsed = createChatbotSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid chatbot name." };
  }
  const { name } = parsed.data;

  // Every chatbot is BYOK-only — chatProviderType/embeddingProvider start
  // out null ("not configured yet") until the owner sets a real provider +
  // key in Settings.
  const [created] = await db
    .insert(chatbots)
    .values({
      workspaceId: workspace.id,
      name,
    })
    .returning();

  if (!created) {
    return { error: "Failed to create chatbot. Please try again." };
  }

  redirect(`/workspace/${workspace.id}/chatbots/${created.id}/settings`);
}
