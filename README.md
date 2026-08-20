# Parrot — Embeddable Chatbot Builder

Parrot turns your own documents into a chat assistant that answers strictly
from what you gave it. Upload PDFs, Word docs, or text (or paste a quick
snippet), and Parrot ingests and embeds them so the assistant only ever
answers from your own content. Use it inside its own dashboard like a
private ChatGPT, or embed the same chatbot on your website with a couple of
lines of JavaScript so your visitors can ask it questions too.

## Monorepo layout

pnpm workspace + Turborepo, three Next.js 16 apps and a set of shared
packages:

- `apps/landing` — marketing site, port 3000, no basePath, owns `/`.
- `apps/app` — the product itself (chatbot creation, document ingestion,
  the embeddable widget backend), port 3001, basePath `/app`. Also ships
  the ingestion worker (`apps/app/dist/worker.js`, built from
  `apps/app/esbuild.worker.mjs`) — a separate process, same codebase.
- `apps/admin` — internal/staff admin surface, port 3002, basePath
  `/admin`.
- `packages/auth`, `packages/config`, `packages/db`, `packages/ui` —
  shared code across the three apps (Supabase auth helpers, Drizzle
  schema/client, UI components, shared config).
- `supabase/` — the official self-hosted Supabase Docker distribution,
  vendored as-is (untouched). This project's Postgres, Auth, REST, Storage,
  and Realtime all come from here.
- `docker-compose.yml` / `docker-compose_vps.yml` — see below.
- `nginx/` — nginx configs for the containerized dry-run and the VPS deploy.
- `scripts/` — small deploy-helper shell scripts.

## Local development

The day-to-day workflow is host-run `pnpm dev` against a containerized
Supabase — not the fully-containerized stack (that's covered separately
below as a dry-run/verification step).

1. **Install dependencies** (Node >= 22, pnpm 9.15.0 — pinned via
   `packageManager` in `package.json`):

   ```bash
   pnpm install
   ```

2. **Start the vendored Supabase stack:**

   ```bash
   cd supabase
   cp .env.example .env   # first time only — fill in real secrets, see below
   sh run.sh start
   cd ..
   ```

   This brings up Postgres, Auth, REST, Storage, Realtime, the API gateway
   (on `http://localhost:8000`), and Supabase Studio, all via
   `supabase/docker-compose.yml`. `sh run.sh stop`/`status`/`logs` manage it
   afterward — see the usage comment at the top of `supabase/run.sh`.

3. **Set up the root `.env`:**

   ```bash
   cp .env.example .env
   ```

   Fill in `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`
   to match what you put in `supabase/.env` (they must be identical), and
   generate `AES_MASTER_KEY` with:

   ```bash
   ./scripts/generate-aes-key.sh
   ```

   Every chatbot is BYOK (bring-your-own-key) for both chat and embeddings —
   there's no platform-managed provider key to set. A new chatbot starts
   unconfigured; configure a real provider + key for it in Settings before
   it can chat or ingest documents.

4. **Run migrations:**

   ```bash
   pnpm db:migrate
   ```

   (runs `drizzle-kit migrate` against `packages/db`'s schema; `pnpm
   db:generate` regenerates migrations from schema changes.)

5. **Run the three apps:**

   ```bash
   pnpm dev
   ```

   Turborepo starts all three on their fixed ports: landing on
   `:3000`, app on `:3001`, admin on `:3002`.

6. **Run the ingestion worker** (separate process, picks up ingestion jobs
   via `pg-boss`):

   ```bash
   pnpm --filter app run worker:build
   pnpm --filter app run worker:start
   ```

## Local full containerized dry-run

To verify the whole stack (Supabase + all three Next.js apps + the worker +
nginx) running fully inside Docker, as it would on a VPS — rather than the
host-run `pnpm dev` workflow above:

```bash
docker compose --profile containers up -d --build
```

`docker-compose.yml`'s `app`/`worker`/`admin`/`landing`/`nginx` services are
gated behind the `containers` profile, so a plain `docker compose up -d`
(no profile) only starts Supabase, matching the normal dev workflow above.
With `--profile containers`, nginx does path-based routing on port 80:

- `http://localhost/` → landing
- `http://localhost/app` → the app
- `http://localhost/admin` → admin

(Supabase's own gateway stays reachable directly at `http://localhost:8000`,
matching what's already published by `supabase/docker-compose.yml` — see
`nginx/nginx.conf`'s header comment for why it's intentionally not also
proxied through nginx in this local scenario.)

## VPS deployment

`docker-compose_vps.yml` is the production variant: same services, but
`app`/`admin`/`landing` reference prebuilt images (no `build:` — this repo
has no CI/registry set up, so building and pushing images is a manual step
for now), no service is gated behind a profile (everything always starts),
only `nginx` is reachable from the public internet, and resource limits are
sized for a small 4GB RAM / 2 vCPU VPS. See that file's own header comment
for the full list of differences from the dev compose file.

### 1. Build and push the images

From your own machine (or your own future CI), for each of the three apps:

```bash
docker build -f apps/app/Dockerfile \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-domain.example.com \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key> \
  -t ghcr.io/<you>/cbb-app:latest .
docker push ghcr.io/<you>/cbb-app:latest

docker build -f apps/admin/Dockerfile \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-domain.example.com \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key> \
  -t ghcr.io/<you>/cbb-admin:latest .
docker push ghcr.io/<you>/cbb-admin:latest

docker build -f apps/landing/Dockerfile -t ghcr.io/<you>/cbb-landing:latest .
docker push ghcr.io/<you>/cbb-landing:latest
```

Build context must be the repo root for all three (per each Dockerfile's
own header comment). `NEXT_PUBLIC_SUPABASE_URL` must be your final public
`https://<domain>` — it's inlined into the browser bundle at build time and
can't be changed later without rebuilding (see
`nginx/nginx.vps.conf`'s header comment for why: nginx proxies Supabase's
API paths through the same public origin in this deploy, rather than
exposing Supabase's gateway on its own port like the local dry-run does).

Set `REGISTRY`/`TAG` in `.env.prod` (below) to match whatever you pushed.

### 2. Prepare the VPS

SSH into the VPS, clone this repo, then:

```bash
cp .env.prod.example .env.prod
cp supabase/.env.prod.example supabase/.env.prod
```

Fill in real secrets in both (they share `POSTGRES_PASSWORD`, `JWT_SECRET`,
`ANON_KEY`, `SERVICE_ROLE_KEY` — generate those once via
`supabase/utils/generate-keys.sh` / `add-new-auth-keys.sh` and copy the
results into both files, same split as local dev's `.env`/`supabase/.env`).
Set `DOMAIN` and `CERTBOT_EMAIL` in `.env.prod` to your real domain/email.

### 3. Point DNS at the box, then set up HTTPS

Once your domain's DNS A/AAAA record points at the VPS:

```bash
sudo ./scripts/setup-nginx-ssl.sh <domain> <email>
```

This obtains a Let's Encrypt certificate (certbot, standalone or webroot
mode depending on whether the stack is already running — see the script's
own header comment) and switches `nginx/nginx.vps.conf` over to the
HTTPS-enabled config. Safe to re-run for renewal.

### 4. Deploy

```bash
./scripts/vps-deploy.sh
```

Copies `.env.prod` → `.env` and `supabase/.env.prod` → `supabase/.env`
(failing fast with a clear error if either `.env.prod` file is missing,
rather than silently deploying with stale/missing env), then pulls the
images referenced by `.env`'s `REGISTRY`/`TAG` and brings up
`docker-compose_vps.yml`. Re-run any time to pick up a new image tag or an
`.env.prod` change.

## Validation notes

This was verified from a sandbox without a real VPS/DNS: `docker compose -f
docker-compose_vps.yml config` resolves cleanly, and both
`nginx/nginx.vps.conf` and the HTTPS config rendered from
`nginx/nginx.vps.ssl.conf.template` pass `nginx -t` (using dummy self-signed
certs for the latter). The actual Let's Encrypt issuance, DNS, and a live
VPS run still need to be done for real by whoever operates the box.
