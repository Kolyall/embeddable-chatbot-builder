import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chatbots } from "./chatbots";

export const documentKindEnum = pgEnum("document_kind", ["file", "snippet"]);
export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

/**
 * Content sources are files (PDF/DOCX/TXT/MD) or manual text snippets only —
 * no URL crawling (Decision 11). Ingestion is asynchronous via pg-boss
 * (Decision 12); `status` is surfaced live to the UI via Supabase Realtime.
 */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatbotId: uuid("chatbot_id")
    .notNull()
    .references(() => chatbots.id, { onDelete: "cascade" }),
  kind: documentKindEnum("kind").notNull(),
  filename: text("filename"), // null for 'snippet'
  storagePath: text("storage_path"), // Supabase Storage path, null for 'snippet'
  content: text("content"), // raw pasted text, only set for 'snippet'
  status: documentStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
