// Bundles the standalone ingestion worker (src/workers/ingestion-worker.ts)
// into a single dist/worker.js, run via `node dist/worker.js` — separate
// from the Next.js build entirely (see Dockerfile worker stage). Fully
// bundled (no external npm deps beyond Node builtins) so the runtime image
// only needs to ship this one file alongside Node itself.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  absWorkingDir: __dirname,
  entryPoints: ["src/workers/ingestion-worker.ts"],
  outfile: "dist/worker.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  sourcemap: true,
  logLevel: "info",
  // Packages that ship optional native/conditional requires unrelated to
  // this worker's actual code paths — left external so esbuild doesn't fail
  // trying to resolve them; if not installed, Node simply never requires
  // them at runtime either since they're inside try/catch or unused branches.
  external: [
    "pg-native",
    "pg-cloudflare",
    "bufferutil",
    "utf-8-validate",
    "cloudflare:sockets",
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
