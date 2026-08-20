import type { LanguageModel } from "ai";
import type { Chatbot } from "@cbb/db";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { decryptApiKey } from "@/lib/crypto/aes-gcm";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

/**
 * Thrown when a BYOK chatbot (`openai_compatible`/`anthropic`) is missing
 * required configuration (base URL, model, or API key), or hasn't had a
 * provider configured at all yet. Callers should catch this and surface
 * `message` to the user (e.g. "fix this in Settings") rather than letting
 * it bubble up as a raw 500.
 */
export class ChatProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatProviderConfigError";
  }
}

/**
 * Returns the Vercel AI SDK `LanguageModel` to pass to `streamText({ model })`
 * for this chatbot, dispatching on `chatProviderType`. Never caches the
 * result across chatbots — BYOK keys are decrypted fresh on every call.
 * Every chatbot is BYOK-only — there is no platform-managed fallback.
 */
export function getChatModel(chatbot: Chatbot): LanguageModel {
  switch (chatbot.chatProviderType) {
    case null: {
      throw new ChatProviderConfigError(
        "This chatbot doesn't have a chat provider configured yet. Set one up in Settings.",
      );
    }
    case "openai_compatible": {
      if (!chatbot.chatBaseUrl || !chatbot.chatModel || !chatbot.chatApiKeyEncrypted) {
        throw new ChatProviderConfigError(
          "This chatbot's OpenAI-compatible chat provider is missing its base URL, model, or API key. Fix this in Settings.",
        );
      }
      const apiKey = decryptApiKey(chatbot.chatApiKeyEncrypted);
      return createOpenAI({ apiKey, baseURL: chatbot.chatBaseUrl })(chatbot.chatModel);
    }
    case "anthropic": {
      if (!chatbot.chatApiKeyEncrypted) {
        throw new ChatProviderConfigError(
          "This chatbot's Anthropic chat provider is missing its API key. Fix this in Settings.",
        );
      }
      const apiKey = decryptApiKey(chatbot.chatApiKeyEncrypted);
      return createAnthropic({ apiKey })(chatbot.chatModel ?? DEFAULT_ANTHROPIC_MODEL);
    }
    default: {
      const exhaustive: never = chatbot.chatProviderType;
      throw new Error(`Unknown chat provider type: ${exhaustive}`);
    }
  }
}
