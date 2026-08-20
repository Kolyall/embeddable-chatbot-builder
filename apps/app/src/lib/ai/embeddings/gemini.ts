import { batchArray } from "./batch";
import type { EmbedResult } from "./openai";

const MODEL = "text-embedding-004"; // 768 dims
const BATCH_SIZE = 100; // Gemini's batchEmbedContents caps at 100 requests/call

/** Google Generative Language API — plain fetch, no SDK dependency. */
export async function embedWithGemini(apiKey: string, texts: string[]): Promise<EmbedResult> {
  const vectors: number[][] = [];

  for (const batch of batchArray(texts, BATCH_SIZE)) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${MODEL}`,
            content: { parts: [{ text }] },
          })),
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini embeddings request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { embeddings: { values: number[] }[] };
    for (const embedding of data.embeddings) {
      vectors.push(embedding.values);
    }
  }

  const dim = vectors[0]?.length ?? 0;
  return { vectors, dim };
}
