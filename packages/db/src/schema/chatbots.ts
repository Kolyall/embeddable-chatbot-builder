import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

/**
 * Every chatbot is BYOK-only — there is no platform-managed provider, for
 * either chat or embeddings. `chatProviderType`/`embeddingProvider` are null
 * until the owner configures a real provider + key in Settings; the chat
 * route and ingestion worker both treat null as "not configured yet" and
 * surface a clear message rather than falling back to anything.
 */
export const chatProviderTypeEnum = pgEnum("chat_provider_type", [
  "openai_compatible",
  "anthropic",
]);

/** Embeddings BYOK is restricted to a whitelist with known fixed vector
 * dimensions (Decision 23) — arbitrary endpoints are only accepted for chat. */
export const embeddingProviderEnum = pgEnum("embedding_provider", [
  "openai",
  "gemini",
  "voyage",
  "cohere",
]);

export const chatbots = pgTable("chatbots", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),

  chatProviderType: chatProviderTypeEnum("chat_provider_type"),
  /** Only used when chatProviderType = 'openai_compatible' (e.g. OpenRouter, GonkaAI). */
  chatBaseUrl: text("chat_base_url"),
  chatModel: text("chat_model"),
  /** AES-256-GCM ciphertext (base64), decrypted server-side only, right
   * before calling the provider (see apps/app/src/lib/crypto/aes-gcm.ts). */
  chatApiKeyEncrypted: text("chat_api_key_encrypted"),

  embeddingProvider: embeddingProviderEnum("embedding_provider"),
  embeddingApiKeyEncrypted: text("embedding_api_key_encrypted"),
  /** Set once the first embedding call succeeds; changing provider/model
   * after this is set requires re-indexing all documents (Decision 6). */
  embeddingDim: integer("embedding_dim"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Chatbot = typeof chatbots.$inferSelect;
export type NewChatbot = typeof chatbots.$inferInsert;
