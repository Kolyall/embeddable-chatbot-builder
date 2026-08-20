"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, chatbots, documents, chatProviderTypeEnum, embeddingProviderEnum } from "@cbb/db";
import { and, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { encryptApiKey } from "@/lib/crypto/aes-gcm";
import { listOpenAICompatibleModels, listAnthropicModels, ListModelsError } from "@/lib/ai/chat/list-models";
import { getServiceRoleClient, DOCUMENTS_BUCKET } from "@/lib/storage/service-role-client";
import type { ActionState } from "@/lib/action-state";

const CHAT_PROVIDER_VALUES = chatProviderTypeEnum.enumValues;
const EMBEDDING_PROVIDER_VALUES = embeddingProviderEnum.enumValues;

type ChatProviderType = (typeof CHAT_PROVIDER_VALUES)[number];
type EmbeddingProvider = (typeof EMBEDDING_PROVIDER_VALUES)[number];

const nameSchema = z
  .string({ required_error: "Chatbot name is required.", invalid_type_error: "Chatbot name is required." })
  .trim()
  .min(1, "Chatbot name is required.")
  .max(100, "Chatbot name must be 100 characters or fewer.");

const chatProviderTypeSchema = z.enum(CHAT_PROVIDER_VALUES, {
  invalid_type_error: "Invalid chat provider.",
});
const embeddingProviderSchema = z.enum(EMBEDDING_PROVIDER_VALUES, {
  invalid_type_error: "Invalid embeddings provider.",
});

const chatBaseUrlSchema = z
  .string({
    required_error: "Base URL and model are required for an OpenAI-compatible endpoint.",
    invalid_type_error: "Base URL and model are required for an OpenAI-compatible endpoint.",
  })
  .trim()
  .min(1, "Base URL and model are required for an OpenAI-compatible endpoint.")
  .max(500, "Base URL must be 500 characters or fewer.")
  .url("Enter a valid URL, e.g. https://api.example.com/v1");

const modelSchema = (requiredMessage: string) =>
  z
    .string({ required_error: requiredMessage, invalid_type_error: requiredMessage })
    .trim()
    .min(1, requiredMessage)
    .max(200, "Model must be 200 characters or fewer.");

const apiKeyInputSchema = z
  .string({ invalid_type_error: "Enter a valid API key." })
  .max(500, "API key must be 500 characters or fewer.");

export async function updateChatbotSettings(
  workspaceId: string,
  chatbotId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const nameResult = nameSchema.safeParse(formData.get("name"));
  if (!nameResult.success) {
    return { error: nameResult.error.issues[0]?.message ?? "Invalid chatbot name." };
  }
  const name = nameResult.data;

  const chatProviderTypeResult = chatProviderTypeSchema.safeParse(formData.get("chatProviderType"));
  if (!chatProviderTypeResult.success) {
    return { error: "Choose a chat provider." };
  }
  const embeddingProviderResult = embeddingProviderSchema.safeParse(formData.get("embeddingProvider"));
  if (!embeddingProviderResult.success) {
    return { error: "Choose an embeddings provider." };
  }

  const chatProviderType: ChatProviderType = chatProviderTypeResult.data;
  const embeddingProvider: EmbeddingProvider = embeddingProviderResult.data;

  // Every workspace (Free or Pro) brings its own provider/key for both chat
  // and embeddings — there's no plan-based restriction to re-check here
  // (unlike an earlier design where BYOK was Pro-only).
  const values: Partial<typeof chatbots.$inferInsert> = { name };

  // A stored key only carries over if the provider itself didn't change —
  // an OpenAI key is meaningless once you've switched to Anthropic.
  const chatProviderUnchanged = chatbot.chatProviderType === chatProviderType;

  if (chatProviderType === "openai_compatible") {
    const chatBaseUrlResult = chatBaseUrlSchema.safeParse(formData.get("chatBaseUrl"));
    if (!chatBaseUrlResult.success) {
      return { error: chatBaseUrlResult.error.issues[0]?.message ?? "Enter a valid base URL." };
    }
    const chatModelResult = modelSchema(
      "Base URL and model are required for an OpenAI-compatible endpoint.",
    ).safeParse(formData.get("chatModel"));
    if (!chatModelResult.success) {
      return { error: chatModelResult.error.issues[0]?.message ?? "Enter a valid model." };
    }
    const chatApiKeyResult = apiKeyInputSchema.safeParse(formData.get("chatApiKey") ?? "");
    if (!chatApiKeyResult.success) {
      return { error: chatApiKeyResult.error.issues[0]?.message ?? "Enter a valid API key." };
    }
    const chatApiKeyInput = chatApiKeyResult.data.trim();
    const chatApiKeyEncrypted = chatApiKeyInput
      ? encryptApiKey(chatApiKeyInput)
      : chatProviderUnchanged
        ? chatbot.chatApiKeyEncrypted
        : null;
    if (!chatApiKeyEncrypted) {
      return { error: "An API key is required for an OpenAI-compatible endpoint." };
    }
    values.chatProviderType = "openai_compatible";
    values.chatBaseUrl = chatBaseUrlResult.data;
    values.chatModel = chatModelResult.data;
    values.chatApiKeyEncrypted = chatApiKeyEncrypted;
  } else {
    // anthropic
    const chatModelResult = modelSchema("A model is required for Anthropic.").safeParse(
      formData.get("chatModel"),
    );
    if (!chatModelResult.success) {
      return { error: chatModelResult.error.issues[0]?.message ?? "Enter a valid model." };
    }
    const chatApiKeyResult = apiKeyInputSchema.safeParse(formData.get("chatApiKey") ?? "");
    if (!chatApiKeyResult.success) {
      return { error: chatApiKeyResult.error.issues[0]?.message ?? "Enter a valid API key." };
    }
    const chatApiKeyInput = chatApiKeyResult.data.trim();
    const chatApiKeyEncrypted = chatApiKeyInput
      ? encryptApiKey(chatApiKeyInput)
      : chatProviderUnchanged
        ? chatbot.chatApiKeyEncrypted
        : null;
    if (!chatApiKeyEncrypted) {
      return { error: "An API key is required for Anthropic." };
    }
    values.chatProviderType = "anthropic";
    values.chatBaseUrl = null;
    values.chatModel = chatModelResult.data;
    values.chatApiKeyEncrypted = chatApiKeyEncrypted;
  }

  const embeddingProviderUnchanged = chatbot.embeddingProvider === embeddingProvider;

  const embeddingApiKeyResult = apiKeyInputSchema.safeParse(formData.get("embeddingApiKey") ?? "");
  if (!embeddingApiKeyResult.success) {
    return { error: embeddingApiKeyResult.error.issues[0]?.message ?? "Enter a valid API key." };
  }
  const embeddingApiKeyInput = embeddingApiKeyResult.data.trim();
  const embeddingApiKeyEncrypted = embeddingApiKeyInput
    ? encryptApiKey(embeddingApiKeyInput)
    : embeddingProviderUnchanged
      ? chatbot.embeddingApiKeyEncrypted
      : null;
  if (!embeddingApiKeyEncrypted) {
    return { error: "An API key is required for this embeddings provider." };
  }
  values.embeddingProvider = embeddingProvider;
  values.embeddingApiKeyEncrypted = embeddingApiKeyEncrypted;

  const db = getDb();
  await db.update(chatbots).set(values).where(eq(chatbots.id, chatbot.id));

  redirect(`/workspace/${workspace.id}/chatbots/${chatbot.id}/settings?saved=1`);
}

export type FetchModelsResult = { models: string[] } | { error: string };

/**
 * Called from the settings form's "Fetch models" button, using whatever the
 * user just typed into the base-URL/API-key fields — NOT yet saved/encrypted.
 * The plaintext key only ever exists for the duration of this one outbound
 * request; nothing here is persisted.
 */
export async function fetchChatModels(
  workspaceId: string,
  chatbotId: string,
  providerType: "openai_compatible" | "anthropic",
  baseUrl: string | undefined,
  apiKey: string,
): Promise<FetchModelsResult> {
  const user = await requireUserOrRedirect();
  await getOwnedChatbot(workspaceId, chatbotId, user.id);

  if (!apiKey.trim()) {
    return { error: "Enter an API key first." };
  }

  try {
    if (providerType === "openai_compatible") {
      if (!baseUrl?.trim()) {
        return { error: "Enter a base URL first." };
      }
      const models = await listOpenAICompatibleModels(baseUrl.trim(), apiKey.trim());
      return { models };
    }
    const models = await listAnthropicModels(apiKey.trim());
    return { models };
  } catch (err) {
    if (err instanceof ListModelsError) {
      return { error: err.message };
    }
    return { error: "Could not fetch models — check the details above and try again." };
  }
}

/**
 * Permanently deletes a chatbot. `documents`, `document_chunks`, and
 * `widget_rate_limit` rows all cascade-delete via their chatbot_id/
 * document_id foreign keys (see packages/db/src/schema) — the only thing
 * that needs explicit cleanup here is the underlying Supabase Storage
 * objects for any uploaded files, which Postgres FKs can't reach.
 */
export async function deleteChatbot(workspaceId: string, chatbotId: string): Promise<void> {
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const db = getDb();
  const fileDocuments = await db
    .select({ storagePath: documents.storagePath })
    .from(documents)
    .where(and(eq(documents.chatbotId, chatbot.id), eq(documents.kind, "file")));

  const storagePaths = fileDocuments
    .map((doc) => doc.storagePath)
    .filter((path): path is string => path !== null);

  if (storagePaths.length > 0) {
    const supabase = getServiceRoleClient();
    await supabase.storage.from(DOCUMENTS_BUCKET).remove(storagePaths);
  }

  await db.delete(chatbots).where(eq(chatbots.id, chatbot.id));

  redirect(`/workspace/${workspace.id}`);
}
