"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, documents, PLAN_LIMITS } from "@cbb/db";
import { count, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { isSupportedExtension, SUPPORTED_EXTENSIONS } from "@/lib/ingestion/parsers";
import { getServiceRoleClient, DOCUMENTS_BUCKET, documentStoragePath } from "@/lib/storage/service-role-client";
import { enqueueIngestJob } from "@/lib/jobs/pgboss-client";
import type { ActionState } from "@/lib/action-state";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB — leaves room under the 20MB Server Action body cap

// Generous but bounded — the ingestion chunker (chunker.ts) happily splits
// arbitrarily long text, this just guards against someone pasting something
// absurd (megabytes) into a plain <textarea> Server Action submit.
const MAX_SNIPPET_CHARS = 200_000;

const snippetSchema = z
  .string({ required_error: "Paste some text before saving.", invalid_type_error: "Paste some text before saving." })
  .trim()
  .min(1, "Paste some text before saving.")
  .max(MAX_SNIPPET_CHARS, `Snippet is too long (max ${MAX_SNIPPET_CHARS.toLocaleString()} characters).`);

async function assertUnderDocumentLimit(chatbotId: string, plan: "free" | "pro"): Promise<string | null> {
  const limit = PLAN_LIMITS[plan].maxDocumentsPerChatbot;
  if (limit === Infinity) return null;

  const db = getDb();
  const [row] = await db.select({ count: count() }).from(documents).where(eq(documents.chatbotId, chatbotId));
  const existing = row?.count ?? 0;
  if (existing >= limit) {
    return `You've reached the ${limit}-document limit for the ${plan === "pro" ? "Pro" : "Free"} plan. Upgrade or delete an existing document first.`;
  }
  return null;
}

export async function uploadDocument(
  workspaceId: string,
  chatbotId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (!isSupportedExtension(file.name)) {
    return { error: `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(", ").toUpperCase()}.` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB).` };
  }

  const limitError = await assertUnderDocumentLimit(chatbot.id, workspace.plan);
  if (limitError) return { error: limitError };

  const db = getDb();
  const documentId = randomUUID();
  const storagePath = documentStoragePath(chatbot.id, documentId, file.name);

  const supabase = getServiceRoleClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  try {
    await db.insert(documents).values({
      id: documentId,
      chatbotId: chatbot.id,
      kind: "file",
      filename: file.name,
      storagePath,
      status: "pending",
    });
    await enqueueIngestJob(documentId);
  } catch (err) {
    // Roll back the uploaded object if we couldn't record/enqueue it, so we
    // never leave an orphaned Storage object with no corresponding row.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]).catch(() => {});
    const message = err instanceof Error ? err.message : "Failed to save the document.";
    return { error: message };
  }

  revalidatePath(`/workspace/${workspace.id}/chatbots/${chatbot.id}/documents`);
  return {};
}

export async function createSnippet(
  workspaceId: string,
  chatbotId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const contentResult = snippetSchema.safeParse(formData.get("content"));
  if (!contentResult.success) {
    return { error: contentResult.error.issues[0]?.message ?? "Invalid snippet text." };
  }
  const content = contentResult.data;

  const limitError = await assertUnderDocumentLimit(chatbot.id, workspace.plan);
  if (limitError) return { error: limitError };

  const db = getDb();
  const documentId = randomUUID();

  await db.insert(documents).values({
    id: documentId,
    chatbotId: chatbot.id,
    kind: "snippet",
    content,
    status: "pending",
  });
  await enqueueIngestJob(documentId);

  revalidatePath(`/workspace/${workspace.id}/chatbots/${chatbot.id}/documents`);
  return {};
}

export async function deleteDocument(workspaceId: string, chatbotId: string, formData: FormData): Promise<void> {
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) return;

  const db = getDb();
  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

  // Re-verify the document actually belongs to this chatbot — never trust
  // the posted documentId alone, even though it came from our own form.
  if (!document || document.chatbotId !== chatbot.id) return;

  if (document.kind === "file" && document.storagePath) {
    const supabase = getServiceRoleClient();
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storagePath]);
  }

  await db.delete(documents).where(eq(documents.id, documentId));

  revalidatePath(`/workspace/${workspace.id}/chatbots/${chatbot.id}/documents`);
}
