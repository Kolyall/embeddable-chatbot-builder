import { createClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "documents";

let _client: ReturnType<typeof createClient> | undefined;

/**
 * Service-role Supabase client for server-only Storage access (uploads from
 * Server Actions, downloads from the ingestion worker). Never expose this
 * client or its key to the browser — the `documents` bucket is private and
 * every object is written/read exclusively through this client.
 *
 * Deliberately built on plain `@supabase/supabase-js` (not `@supabase/ssr`,
 * which pulls in `next/headers`) so this module is safe to import from the
 * standalone worker entrypoint too, not just Next.js request handlers.
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

/** Builds the Storage path convention used for every uploaded document. */
export function documentStoragePath(chatbotId: string, documentId: string, filename: string): string {
  return `${chatbotId}/${documentId}/${filename}`;
}
