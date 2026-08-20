"use client";

import { useEffect } from "react";
import { ErrorState } from "@cbb/ui";

/**
 * Catches unexpected errors anywhere in the dashboard (workspace list,
 * workspace detail, plan-override actions) — a DB hiccup, etc. The
 * Unauthorized/Forbidden redirect flows in requireAdminOrRedirect() already
 * happen before rendering, so whatever lands here is genuinely unexpected.
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
