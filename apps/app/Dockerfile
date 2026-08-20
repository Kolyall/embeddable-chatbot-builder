# apps/app/Dockerfile
#
# Build context MUST be the repo root:
#   docker build -f apps/app/Dockerfile -t cbb-app .
#
# Multi-stage: deps (install workspace) -> builder (turbo build + worker
# bundle) -> runner (slim Next.js standalone server + worker.js).
#
# This same image is reused, unmodified, for the "worker" Compose service —
# only the `command` differs (node dist/worker.js instead of server.js).

ARG NODE_IMAGE=node:22-slim

# ---------------------------------------------------------------------------
# deps: install the full pnpm workspace once (cached unless lockfile/manifests change)
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /repo

# corepack ships with node:22-slim and can activate the exact pnpm version
# pinned in package.json's "packageManager" field; fall back to a global
# npm install of the same version if corepack is unavailable/broken, so this
# doesn't silently break the way local corepack did on this dev machine.
RUN corepack enable 2>/dev/null && corepack prepare pnpm@9.15.0 --activate 2>/dev/null \
    || npm install -g pnpm@9.15.0

COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/app/package.json apps/app/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# builder: bring in full source, build the app + bundle the worker
# ---------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /repo
# `deps` already has node_modules installed; layering the full source on
# top leaves those installs in place (COPY never deletes existing files).
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# they must be passed as build args (see docker-compose.yml build.args).
# NEXT_PUBLIC_SUPABASE_URL must be the BROWSER-reachable Supabase gateway
# address (e.g. http://localhost:8000), not the container-network one —
# the browser can't resolve container hostnames like "api-gw". Server-side
# Supabase calls use the separate, non-public SUPABASE_URL runtime env var
# instead (see packages/auth/src/server.ts), which is NOT baked in here and
# can be safely overridden per-container at `docker compose` time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN pnpm exec turbo run build --filter=app
RUN pnpm exec turbo run worker:build --filter=app

# ---------------------------------------------------------------------------
# runner: slim runtime image, standalone Next server + worker bundle
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# .next/standalone mirrors the workspace-relative path and already contains
# a pruned, hoisted node_modules at its root plus apps/app/server.js.
COPY --from=builder /repo/apps/app/.next/standalone ./
COPY --from=builder /repo/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder /repo/apps/app/public ./apps/app/public
COPY --from=builder /repo/apps/app/dist/worker.js ./apps/app/dist/worker.js
COPY --from=builder /repo/apps/app/dist/worker.js.map ./apps/app/dist/worker.js.map

# Next.js standalone output-file-tracing bug (well-documented upstream,
# happens under pnpm too): it copies only @swc/helpers' cjs/ subfolder into
# the pruned standalone node_modules, dropping esm/, which the Next server
# still requires at runtime -> "Cannot find module .../@swc/helpers/esm/...".
# Verified by actually running the built image (see task notes) rather than
# assuming the Dockerfile was correct. Fix: overlay the full package (both
# cjs/ and esm/) from the builder's real, untraced node_modules store.
RUN --mount=type=bind,from=builder,source=/repo/node_modules/.pnpm,target=/mnt/full-pnpm-store \
    bash -c 'set -e; for d in /mnt/full-pnpm-store/@swc+helpers@*/node_modules/@swc/helpers; do \
      ver="${d#/mnt/full-pnpm-store/}"; ver="${ver%%/*}"; \
      dest="/repo/node_modules/.pnpm/$ver/node_modules/@swc/helpers"; \
      if [ -d "$dest" ]; then cp -r "$d"/. "$dest"/; fi; \
    done'

WORKDIR /repo/apps/app
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3001/app/login',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"]

CMD ["node", "server.js"]
