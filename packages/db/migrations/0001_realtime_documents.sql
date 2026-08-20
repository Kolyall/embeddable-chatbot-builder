-- Enables Supabase Realtime (postgres_changes) on the documents table so the
-- documents UI can subscribe to status flips (pending -> processing ->
-- ready/failed) without a manual refresh. No Drizzle schema change here —
-- `supabase_realtime` is a Postgres publication managed outside Drizzle's
-- model, hand-written as a raw-SQL migration.
alter publication supabase_realtime add table public.documents;

-- REPLICA IDENTITY FULL is required for DELETE events to filter correctly.
-- The documents-list Realtime subscription filters on `chatbot_id`, a
-- non-primary-key column. With the default replica identity (DEFAULT),
-- Postgres's WAL only includes primary-key columns in the "old" row for
-- UPDATE/DELETE — so `chatbot_id` is absent, the `chatbot_id=eq.<id>` filter
-- can never match, and DELETE events are silently dropped (INSERT/UPDATE
-- still work fine since they carry the full "new" row regardless). FULL
-- includes every column in the old row, fixing the filter.
alter table public.documents replica identity full;
