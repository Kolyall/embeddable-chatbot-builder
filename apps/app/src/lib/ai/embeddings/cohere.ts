import { batchArray } from "./batch";
import type { EmbedResult } from "./openai";

const MODEL = "embed-english-v3.0"; // 1024 dims
const BATCH_SIZE = 96; // Cohere's per-request text limit

/** Cohere embed REST endpoint — plain fetch, no SDK dependency. */
export async function embedWithCohere(apiKey: string, texts: string[]): Promise<EmbedResult> {
  const vectors: number[][] = [];

  for (const batch of batchArray(texts, BATCH_SIZE)) {
    const res = await fetch("https://api.cohere.com/v1/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        texts: batch,
        model: MODEL,
        input_type: "search_document",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Cohere embeddings request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { embeddings: number[][] };
    for (const embedding of data.embeddings) {
      vectors.push(embedding);
    }
  }

  const dim = vectors[0]?.length ?? 0;
  return { vectors, dim };
}
