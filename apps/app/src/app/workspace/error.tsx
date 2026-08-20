"use client";

import { useEffect } from "react";
import { ErrorState } from "@cbb/ui";

/**
 * Catches unexpected errors anywhere under /workspace (chatbot list,
 * settings, documents, chat, billing) — a DB hiccup, a thrown error from a
 * Server Component query, etc. Deliberately not per-page: the redirect-based
 * flows (requireUserOrRedirect, getOwnedWorkspace/getOwnedChatbot's
 * notFound()) already handle the "expected" auth/ownership cases before
 * anything renders, so whatever lands here is genuinely unexpected.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState message={error.message} onRetry={retry} />;
}
