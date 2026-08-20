import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chatbots } from "./chatbots";
import { documents } from "./documents";
import { vector } from "./custom-types";

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    // Denormalized for retrieval queries, which always scope by chatbot_id
    // (embeddings from different providers/models are incomparable across bots).
    chatbotId: uuid("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("document_chunks_chatbot_id_idx").on(table.chatbotId)],
);

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
