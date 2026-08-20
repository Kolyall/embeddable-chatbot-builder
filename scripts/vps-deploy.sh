#!/usr/bin/env bash
# Deploys/updates the prebuilt-image stack on this VPS.
# Usage: ./scripts/vps-deploy.sh
#
# Run this ON THE VPS, from the repo root, after: cloning/pulling this repo,
# copying .env.prod.example -> .env.prod and supabase/.env.prod.example ->
# supabase/.env.prod and filling in real secrets in both, and (for a fresh
# domain) running scripts/setup-nginx-ssl.sh once DNS points at this box.
# Safe to re-run any time to pick up a new image TAG or .env.prod change.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found in $ROOT." >&2
  echo "Copy .env.prod.example to .env.prod and fill in real secrets first." >&2
  exit 1
fi
if [ ! -f supabase/.env.prod ]; then
  echo "ERROR: supabase/.env.prod not found." >&2
  echo "Copy supabase/.env.prod.example to supabase/.env.prod and fill in real secrets first." >&2
  exit 1
fi

echo "Copying .env.prod -> .env and supabase/.env.prod -> supabase/.env..."
cp .env.prod .env
cp supabase/.env.prod supabase/.env

echo "Pulling prebuilt images..."
docker compose -f docker-compose_vps.yml pull

echo "Starting/updating the stack..."
docker compose -f docker-compose_vps.yml up -d

echo ""
echo "Deploy completed. Containers:"
docker compose -f docker-compose_vps.yml ps
