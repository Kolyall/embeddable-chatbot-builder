import { eq, sql } from "drizzle-orm";
import { getDb, documentChunks, documents, type Chatbot } from "@cbb/db";
import { embedTexts } from "@/lib/ai/embeddings";

export type RetrievalResult = {
  chunks: string[];
  sources: string[];
};

/**
 * Embeds `query` using the chatbot's OWN embeddings config (never the chat
 * provider — the two are independent and the query must land in the same
 * vector space the documents were indexed in), then finds the `k` closest
 * `document_chunks` rows for this chatbot by cosine distance (`<=>`,
 * pgvector operator — no built-in Drizzle helper for it, hence the raw
 * `sql` template below).
 *
 * Returns an empty result (never throws) when the chatbot has no indexed
 * chunks yet, so the chat route can render a friendly "upload documents
 * first" message instead of a 500.
 */
export async function retrieveContext(
  chatbotId: string,
  chatbot: Chatbot,
  query: string,
  k = 6,
): Promise<RetrievalResult> {
  const db = getDb();

  // Cheap existence check first — avoids an embedding API call (and thus a
  // BYOK config/API error) when this chatbot simply has no ready documents.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documentChunks)
    .where(eq(documentChunks.chatbotId, chatbotId));

  if (!count) {
    return { chunks: [], sources: [] };
  }

  const { vectors } = await embedTexts(chatbot, [query]);
  const queryVector = vectors[0];
  if (!queryVector || queryVector.length === 0) {
    return { chunks: [], sources: [] };
  }
  // Same literal encoding as the `vector` custom type's `toDriver` (see
  // packages/db/src/schema/custom-types.ts): "[v1,v2,...]" cast to ::vector.
  const queryVectorLiteral = `[${queryVector.join(",")}]`;

  const rows = await db
    .select({
      content: documentChunks.content,
      filename: documents.filename,
    })
    .from(documentChunks)
    .leftJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(eq(documentChunks.chatbotId, chatbotId))
    .orderBy(sql`${documentChunks.embedding} <=> ${queryVectorLiteral}::vector`)
    .limit(k);

  const sources = Array.from(
    new Set(rows.map((row) => row.filename).filter((filename): filename is string => Boolean(filename))),
  );

  return { chunks: rows.map((row) => row.content), sources };
}
