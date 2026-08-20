/**
 * Standalone ingestion worker entrypoint — NOT part of the Next.js request
 * build. Bundled separately (see ../../esbuild.worker.mjs -> dist/worker.js)
 * and run via `node dist/worker.js`. Must stay free of any Next.js-specific
 * imports (no `next/headers`, no Server Action helpers) since it runs as a
 * plain Node process, not inside the Next.js server.
 */
import { getDb, chatbots, documents, documentChunks, type Document } from "@cbb/db";
import { eq } from "drizzle-orm";
import { getBoss, INGEST_DOCUMENT_JOB, type IngestDocumentJobData } from "@/lib/jobs/pgboss-client";
import { getServiceRoleClient, DOCUMENTS_BUCKET } from "@/lib/storage/service-role-client";
import { parseDocument } from "@/lib/ingestion/parsers";
import { chunkText } from "@/lib/ingestion/chunker";
import { embedTexts } from "@/lib/ai/embeddings";

async function markFailed(documentId: string, errorMessage: string): Promise<void> {
  const db = getDb();
  await db
    .update(documents)
    .set({ status: "failed", errorMessage })
    .where(eq(documents.id, documentId));
}

async function loadTextForDocument(document: Document): Promise<string> {
  if (document.kind === "snippet") {
    return document.content ?? "";
  }

  // kind === 'file'
  if (!document.storagePath || !document.filename) {
    throw new Error("File document is missing storagePath/filename.");
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(document.storagePath);
  if (error || !data) {
    throw new Error(`Failed to download "${document.storagePath}" from Storage: ${error?.message ?? "unknown error"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return parseDocument(buffer, document.filename);
}

/**
 * Processes one document end-to-end: load -> parse (if file) -> chunk ->
 * embed -> write document_chunks -> flip status to 'ready'. Any failure
 * anywhere in this path is caught by the caller and turned into a
 * `documents.status = 'failed'` row with `errorMessage` set, so the UI
 * always sees a terminal state and one bad document never crashes the
 * worker process.
 */
async function processDocument(documentId: string): Promise<void> {
  const db = getDb();

  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!document) {
    console.warn(`[ingestion-worker] document ${documentId} no longer exists, skipping.`);
    return;
  }

  const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, document.chatbotId)).limit(1);
  if (!chatbot) {
    await markFailed(documentId, "Chatbot for this document no longer exists.");
    return;
  }

  await db.update(documents).set({ status: "processing", errorMessage: null }).where(eq(documents.id, documentId));

  const text = await loadTextForDocument(document);
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    await markFailed(documentId, "No extractable text was found in this document.");
    return;
  }

  const { vectors, dim } = await embedTexts(chatbot, chunks);

  if (chatbot.embeddingDim !== null && chatbot.embeddingDim !== dim) {
    await markFailed(
      documentId,
      `Embedding dimension mismatch: this bot's existing documents were indexed at ${chatbot.embeddingDim} dimensions, but the current provider returned ${dim}. Re-index all documents or revert the embeddings provider.`,
    );
    return;
  }

  await db.transaction(async (tx) => {
    if (chatbot.embeddingDim === null) {
      await tx.update(chatbots).set({ embeddingDim: dim }).where(eq(chatbots.id, chatbot.id));
    }

    // Replace any prior (partial/failed) chunks for this document before
    // inserting the fresh set, so re-processing never leaves stale rows.
    await tx.delete(documentChunks).where(eq(documentChunks.documentId, document.id));

    await tx.insert(documentChunks).values(
      chunks.map((content, chunkIndex) => ({
        documentId: document.id,
        chatbotId: document.chatbotId,
        chunkIndex,
        content,
        // Safe: `vectors` and `chunks` are the same length by construction
        // (embedTexts returns exactly one vector per input text).
        embedding: vectors[chunkIndex]!,
      })),
    );

    await tx.update(documents).set({ status: "ready", errorMessage: null }).where(eq(documents.id, document.id));
  });

  console.log(`[ingestion-worker] document ${documentId} ready (${chunks.length} chunks, dim ${dim}).`);
}

async function main() {
  const boss = await getBoss();

  await boss.work<IngestDocumentJobData>(INGEST_DOCUMENT_JOB, async ([job]) => {
    const { documentId } = job.data;
    try {
      await processDocument(documentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ingestion-worker] document ${documentId} failed:`, err);
      try {
        await markFailed(documentId, message);
      } catch (markErr) {
        console.error(`[ingestion-worker] failed to mark document ${documentId} as failed:`, markErr);
      }
      // Re-throw so pg-boss records the job itself as failed (for retry/
      // observability purposes) — the documents.status row above is already
      // in a terminal state regardless of what pg-boss does with the job.
      throw err;
    }
  });

  console.log(`[ingestion-worker] listening for "${INGEST_DOCUMENT_JOB}" jobs...`);
}

main().catch((err) => {
  console.error("[ingestion-worker] fatal startup error:", err);
  process.exit(1);
});
