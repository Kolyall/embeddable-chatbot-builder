#!/usr/bin/env bash
# Obtains (or renews) a Let's Encrypt certificate for the VPS deploy and
# switches nginx/nginx.vps.conf over to the HTTPS-enabled config.
# Usage: sudo ./scripts/setup-nginx-ssl.sh <domain> [email]
#
# Run this ON THE VPS, from the repo root, with DNS for <domain> already
# pointing at this box. Safe to re-run any time (idempotent): if a valid
# cert already exists, certbot just skips reissuing it; nginx.vps.conf is
# regenerated and reloaded every run regardless, so it's also the right
# way to pick up a renewed certificate. A cron entry for renewal is added
# automatically (once) at the bottom of this script.
#
# Two ways this runs, both handled automatically:
#   - Before the stack has ever been started (nginx container not running,
#     e.g. first-time setup before scripts/vps-deploy.sh): uses certbot's
#     standalone mode, which needs port 80 free — that's the case here.
#   - While the stack is already up (e.g. a later renewal): uses certbot's
#     webroot mode instead, since nginx is already holding port 80 and
#     already serves /.well-known/acme-challenge/ from nginx/certbot-webroot
#     in BOTH the bootstrap and HTTPS nginx.vps.conf variants.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOMAIN="${1:-}"
EMAIL="${2:-}"

# Fall back to whatever's already recorded in .env.prod, if present.
if [ -f .env.prod ]; then
  [ -z "$DOMAIN" ] && DOMAIN="$(grep -E '^DOMAIN=' .env.prod | head -1 | cut -d= -f2- || true)"
  [ -z "$EMAIL" ] && EMAIL="$(grep -E '^CERTBOT_EMAIL=' .env.prod | head -1 | cut -d= -f2- || true)"
fi

if [ -z "$DOMAIN" ]; then
  read -r -p "Domain (must already point at this VPS): " DOMAIN
fi
if [ -z "$DOMAIN" ]; then
  echo "ERROR: no domain given." >&2
  exit 1
fi
if [ -z "$EMAIL" ]; then
  read -r -p "Email for Let's Encrypt renewal notices: " EMAIL
fi
if [ -z "$EMAIL" ]; then
  echo "ERROR: no email given (certbot needs one for a real, non-staging cert)." >&2
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "certbot not found — installing (apt)..."
  sudo apt-get update -q -y
  sudo apt-get install -q -y certbot
fi

mkdir -p "$ROOT/nginx/certbot-webroot"

NGINX_RUNNING=false
if docker inspect -f '{{.State.Running}}' cbb-nginx 2>/dev/null | grep -q true; then
  NGINX_RUNNING=true
fi

if [ "$NGINX_RUNNING" = true ]; then
  echo "nginx is already running — using webroot verification..."
  sudo certbot certonly --webroot -w "$ROOT/nginx/certbot-webroot" \
    -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --keep-until-expiring
else
  echo "nginx isn't running yet — using standalone verification (needs port 80 free)..."
  sudo certbot certonly --standalone --preferred-challenges http \
    -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --keep-until-expiring
fi

echo "Rendering nginx/nginx.vps.conf (HTTPS-enabled) for $DOMAIN..."
sed "s/__DOMAIN__/$DOMAIN/g" "$ROOT/nginx/nginx.vps.ssl.conf.template" > "$ROOT/nginx/nginx.vps.conf"

if [ "$NGINX_RUNNING" = true ]; then
  echo "Reloading nginx..."
  docker compose -f "$ROOT/docker-compose_vps.yml" exec nginx nginx -t
  docker compose -f "$ROOT/docker-compose_vps.yml" exec nginx nginx -s reload
else
  echo "nginx isn't running — the HTTPS config will take effect the next time you run scripts/vps-deploy.sh."
fi

# Record the domain/state in .env.prod so subsequent scripts/manual runs
# stay consistent (best-effort — skip if .env.prod doesn't exist yet).
if [ -f .env.prod ]; then
  for var_val in "DOMAIN=$DOMAIN" "SSL_ENABLED=true" "CERTBOT_EMAIL=$EMAIL"; do
    key="${var_val%%=*}"
    if grep -qE "^${key}=" .env.prod; then
      sed -i.bak -E "s|^${key}=.*|${var_val}|" .env.prod && rm -f .env.prod.bak
    else
      echo "$var_val" >> .env.prod
    fi
  done
fi

# Idempotent renewal cron entry (runs twice daily, as certbot recommends;
# certbot itself no-ops unless the cert is due for renewal).
CRON_CMD="cd $ROOT && ./scripts/setup-nginx-ssl.sh $DOMAIN $EMAIL >> $ROOT/nginx/certbot-renew.log 2>&1"
if ! (crontab -l 2>/dev/null | grep -qF "setup-nginx-ssl.sh"); then
  (crontab -l 2>/dev/null; echo "17 3,15 * * * $CRON_CMD") | crontab -
  echo "Added a renewal cron entry (twice daily)."
fi

echo ""
echo "Done. https://$DOMAIN should now serve over TLS once the stack is (re)started."
