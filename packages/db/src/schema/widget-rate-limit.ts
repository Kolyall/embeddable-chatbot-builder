import { integer, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { chatbots } from "./chatbots";

/**
 * Plain Postgres counter for the public widget chat endpoint (Decision 14 —
 * rate limiting only, no domain allowlist, no plan-tied quota). One row per
 * (chatbot, minute bucket); the API route upserts + increments then checks
 * the count. Deliberately NOT pg-boss — pg-boss is only the ingestion queue.
 */
export const widgetRateLimit = pgTable(
  "widget_rate_limit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatbotId: uuid("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [uniqueIndex("widget_rate_limit_chatbot_window_idx").on(table.chatbotId, table.windowStart)],
);

export type WidgetRateLimit = typeof widgetRateLimit.$inferSelect;
