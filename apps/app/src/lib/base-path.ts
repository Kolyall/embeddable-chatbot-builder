/**
 * Single source of truth for this app's Next.js `basePath` (see
 * next.config.ts, which imports this same constant). Needed by any client
 * code that issues a plain `fetch()` to one of this app's own routes —
 * unlike `next/link`/`next/router`, a bare `fetch("/foo")` is NOT
 * basePath-aware, so callers must prefix it themselves.
 */
export const BASE_PATH = "/app";
