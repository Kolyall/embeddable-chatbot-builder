import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

const MODEL_ID = "text-embedding-3-small"; // 1536 dims

export type EmbedResult = { vectors: number[][]; dim: number };

/**
 * `embedMany` batches internally, so we don't do one HTTP call per chunk.
 */
export async function embedWithOpenAI(apiKey: string, texts: string[]): Promise<EmbedResult> {
  const provider = createOpenAI({ apiKey });
  const model = provider.textEmbeddingModel(MODEL_ID);

  const { embeddings } = await embedMany({ model, values: texts });

  const dim = embeddings[0]?.length ?? 0;
  return { vectors: embeddings, dim };
}
