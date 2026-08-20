import type { Chatbot } from "@cbb/db";
import { decryptApiKey } from "@/lib/crypto/aes-gcm";
import { embedWithOpenAI, type EmbedResult } from "./openai";
import { embedWithGemini } from "./gemini";
import { embedWithVoyage } from "./voyage";
import { embedWithCohere } from "./cohere";

export type { EmbedResult };

export class MissingApiKeyError extends Error {
  constructor(provider: string) {
    super(`Chatbot's embeddings provider is "${provider}" but no API key is configured.`);
  }
}

export class EmbeddingsNotConfiguredError extends Error {
  constructor() {
    super("This chatbot's embeddings provider isn't configured yet. Set one up in Settings.");
  }
}

/**
 * Embeds `texts` using the chatbot's configured embeddings provider, batching
 * requests per-provider rather than one HTTP call per chunk. Returns the
 * actual observed vector dimension so the caller (the ingestion worker) can
 * compare it against the chatbot's already-committed `embeddingDim`.
 *
 * Every chatbot is BYOK-only — there is no platform-managed fallback.
 * `embeddingProvider` is null until the owner configures a real provider.
 */
export async function embedTexts(chatbot: Chatbot, texts: string[]): Promise<EmbedResult> {
  if (chatbot.embeddingProvider == null) throw new EmbeddingsNotConfiguredError();

  switch (chatbot.embeddingProvider) {
    case "openai": {
      if (!chatbot.embeddingApiKeyEncrypted) throw new MissingApiKeyError("openai");
      const apiKey = decryptApiKey(chatbot.embeddingApiKeyEncrypted);
      return embedWithOpenAI(apiKey, texts);
    }
    case "gemini": {
      if (!chatbot.embeddingApiKeyEncrypted) throw new MissingApiKeyError("gemini");
      const apiKey = decryptApiKey(chatbot.embeddingApiKeyEncrypted);
      return embedWithGemini(apiKey, texts);
    }
    case "voyage": {
      if (!chatbot.embeddingApiKeyEncrypted) throw new MissingApiKeyError("voyage");
      const apiKey = decryptApiKey(chatbot.embeddingApiKeyEncrypted);
      return embedWithVoyage(apiKey, texts);
    }
    case "cohere": {
      if (!chatbot.embeddingApiKeyEncrypted) throw new MissingApiKeyError("cohere");
      const apiKey = decryptApiKey(chatbot.embeddingApiKeyEncrypted);
      return embedWithCohere(apiKey, texts);
    }
    default: {
      const exhaustive: never = chatbot.embeddingProvider;
      throw new Error(`Unknown embeddings provider: ${exhaustive}`);
    }
  }
}
