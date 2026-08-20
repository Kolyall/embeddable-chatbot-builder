"use client";

import { useEffect } from "react";
import { ErrorState } from "@cbb/ui";

/**
 * Root-level error boundary — the last-resort net for anything outside the
 * more specific /workspace boundary (src/app/workspace/error.tsx). Genuinely
 * unexpected errors only: redirect-driven flows (UnauthorizedError,
 * ForbiddenError, notFound()) never reach here, they resolve before
 * rendering gets this far.
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
