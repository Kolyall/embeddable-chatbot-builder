import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const planEnum = pgEnum("plan", ["free", "pro"]);

/**
 * Single-owner workspace (no team invites/multi-user roles — see the
 * grilling session's Decision 10). A workspace can hold multiple chatbots
 * (Decision 9).
 */
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  plan: planEnum("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

/**
 * Plan gates — kept as plain constants, not a DB table, since billing is
 * fully mocked and these never need to change per-customer.
 *
 * Every workspace (Free or Pro) must bring its own AI provider key for both
 * chat and embeddings — there is no platform-managed provider. What Pro
 * actually buys is more chatbots, unlimited documents, and the ability to
 * embed the chat widget on other websites (Free is in-app chat only).
 */
export const PLAN_LIMITS = {
  free: { maxChatbots: 1, maxDocumentsPerChatbot: 10, widgetEmbedAllowed: false },
  pro: { maxChatbots: 5, maxDocumentsPerChatbot: Infinity, widgetEmbedAllowed: true },
} as const;
