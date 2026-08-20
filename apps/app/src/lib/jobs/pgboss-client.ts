import PgBoss from "pg-boss";

/** Job name for the document ingestion pipeline (parse -> chunk -> embed). */
export const INGEST_DOCUMENT_JOB = "ingest-document";

export type IngestDocumentJobData = {
  documentId: string;
};

let _boss: PgBoss | undefined;
let _starting: Promise<PgBoss> | undefined;

/**
 * Lazily-initialized pg-boss singleton (same pattern as packages/db/src/client.ts),
 * so both the Next.js server (enqueueing) and the standalone worker process
 * (consuming) share one connection/start lifecycle per process. Guards
 * against calling `.start()` more than once across Next.js dev's module
 * reloads by caching the in-flight start promise, not just the instance.
 */
export async function getBoss(): Promise<PgBoss> {
  if (_boss) return _boss;
  if (_starting) return _starting;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const boss = new PgBoss({ connectionString: url });
  boss.on("error", (err) => {
    console.error("[pg-boss] error", err);
  });

  _starting = boss.start().then(async () => {
    // pg-boss v10+ requires the queue to be explicitly created before
    // send()/work() will succeed. createQueue() is idempotent (no-ops if the
    // queue already exists), so it's safe to call on every cold start from
    // both the Next.js server (enqueueing) and the worker (consuming).
    await boss.createQueue(INGEST_DOCUMENT_JOB);
    _boss = boss;
    return boss;
  });

  return _starting;
}

/** Enqueues a document for the ingestion worker to parse/chunk/embed. */
export async function enqueueIngestJob(documentId: string): Promise<void> {
  const boss = await getBoss();
  await boss.send(INGEST_DOCUMENT_JOB, { documentId } satisfies IngestDocumentJobData);
}
