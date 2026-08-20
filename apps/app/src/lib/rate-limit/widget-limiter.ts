import { sql } from "drizzle-orm";
import { getDb, widgetRateLimit } from "@cbb/db";

/**
 * Plain per-minute Postgres counter for the public widget chat endpoint
 * (Decision 14) — deliberately NOT pg-boss, which is only the ingestion job
 * queue. One row per (chatbotId, windowStart minute bucket); upserts +
 * increments atomically via `ON CONFLICT ... DO UPDATE ... RETURNING`, so
 * concurrent requests in the same minute never race each other.
 *
 * Old rows are never cleaned up here — acceptable table growth for this MVP,
 * a cleanup job is out of scope.
 */
export async function checkAndIncrementWidgetRateLimit(
  chatbotId: string,
  limitPerMinute = 20,
): Promise<{ allowed: boolean }> {
  const db = getDb();

  const now = Date.now();
  const windowStart = new Date(now - (now % 60_000));

  const [row] = await db
    .insert(widgetRateLimit)
    .values({ chatbotId, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [widgetRateLimit.chatbotId, widgetRateLimit.windowStart],
      set: { count: sql`${widgetRateLimit.count} + 1` },
    })
    .returning({ count: widgetRateLimit.count });

  const count = row?.count ?? 1;
  return { allowed: count <= limitPerMinute };
}
