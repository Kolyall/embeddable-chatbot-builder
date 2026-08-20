"use client";

import { useEffect } from "react";
import { ErrorState } from "@cbb/ui";

/**
 * Root-level error boundary — the last-resort net for anything outside the
 * more specific (dashboard)/error.tsx boundary. Genuinely unexpected errors
 * only: requireAdminOrRedirect()'s Unauthorized/Forbidden flows already
 * redirect before anything renders.
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
