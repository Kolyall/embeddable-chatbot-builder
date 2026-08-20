import { cache } from "react";
import { notFound } from "next/navigation";
import { getDb, workspaces, chatbots, documents, type Workspace, type Chatbot, type Document } from "@cbb/db";
import { eq } from "drizzle-orm";

/**
 * Loads a workspace and verifies the given user owns it — 404s rather than
 * trusting the URL param alone. Every Server Component/Server Action that
 * takes a workspaceId from the URL must go through this (never query
 * `workspaces` by id alone). Wrapped in React's `cache()` so the layout and
 * page for the same request share one query instead of two.
 */
export const getOwnedWorkspace = cache(async function getOwnedWorkspace(
  workspaceId: string,
  userId: string,
): Promise<Workspace> {
  const db = getDb();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!workspace || workspace.ownerId !== userId) {
    notFound();
  }
  return workspace;
});

/**
 * Loads a chatbot and verifies it belongs to a workspace owned by the given
 * user. Returns both so callers don't need a second query.
 */
export const getOwnedChatbot = cache(async function getOwnedChatbot(
  workspaceId: string,
  chatbotId: string,
  userId: string,
): Promise<{ workspace: Workspace; chatbot: Chatbot }> {
  const workspace = await getOwnedWorkspace(workspaceId, userId);
  const db = getDb();
  const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, chatbotId)).limit(1);
  if (!chatbot || chatbot.workspaceId !== workspace.id) {
    notFound();
  }
  return { workspace, chatbot };
});

/**
 * Loads a document and verifies it belongs to a chatbot in a workspace
 * owned by the given user. Returns all three so callers don't need extra
 * queries.
 */
export const getOwnedDocument = cache(async function getOwnedDocument(
  workspaceId: string,
  chatbotId: string,
  documentId: string,
  userId: string,
): Promise<{ workspace: Workspace; chatbot: Chatbot; document: Document }> {
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, userId);
  const db = getDb();
  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!document || document.chatbotId !== chatbot.id) {
    notFound();
  }
  return { workspace, chatbot, document };
});
