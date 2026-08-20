import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Mirrors auth.users (Supabase Auth, in the "auth" schema managed by GoTrue).
 * Populated by a DB trigger (see migrations/0000_.../profiles_trigger.sql,
 * added by hand after the initial drizzle-kit generate) on auth.users insert.
 * `is_admin` is the only thing that gates access to apps/admin.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // == auth.users.id
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
