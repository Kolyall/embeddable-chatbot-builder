import { batchArray } from "./batch";
import type { EmbedResult } from "./openai";

const MODEL = "voyage-3"; // 1024 dims
const BATCH_SIZE = 128; // Voyage's per-request input limit

/** Voyage AI embeddings REST endpoint — plain fetch, no SDK dependency. */
export async function embedWithVoyage(apiKey: string, texts: string[]): Promise<EmbedResult> {
  const vectors: number[][] = [];

  for (const batch of batchArray(texts, BATCH_SIZE)) {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: batch, model: MODEL }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Voyage embeddings request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { data: { embedding: number[]; index: number }[] };
    const sorted = [...data.data].sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      vectors.push(item.embedding);
    }
  }

  const dim = vectors[0]?.length ?? 0;
  return { vectors, dim };
}
