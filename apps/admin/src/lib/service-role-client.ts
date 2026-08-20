import { createClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "documents";

let _client: ReturnType<typeof createClient> | undefined;

/**
 * Service-role Supabase client for admin-only operations: deleting a user
 * from Supabase Auth (`auth.admin.deleteUser`) and cleaning up their
 * Storage objects first, since `auth.users` deletion cascades every DB row
 * (profiles -> workspaces -> chatbots -> documents/document_chunks) but
 * can't reach Storage. Mirrors apps/app/src/lib/storage/service-role-client.ts —
 * kept local rather than shared since this is the only app that needs
 * `auth.admin.*`.
 */
export function getServiceRoleClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}
