import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

// Path-based routing on one domain (Decision 27): nginx forwards /app/* here.
// basePath must match so this app's own asset/link URLs resolve correctly
// behind the proxy — see supabase auth cookie/basePath note in the plan.
// `BASE_PATH` lives in src/lib/base-path.ts (not defined here) so client code
// issuing plain `fetch()` calls (e.g. useChat's `api` option, which — unlike
// next/link — is NOT basePath-aware) can import the same constant.
const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  // Lets browser-automation tooling (which reaches this dev server via
  // host.docker.internal rather than localhost) through Next's dev-only
  // cross-origin request guard. Dev-only setting — has no effect in the
  // production "standalone" build.
  allowedDevOrigins: ["host.docker.internal"],
  transpilePackages: ["@cbb/db", "@cbb/auth", "@cbb/ui"],
  experimental: {
    // Document uploads (PDF/DOCX) go through a Server Action, which defaults
    // to a 1MB request body cap — raised so real documents fit.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
