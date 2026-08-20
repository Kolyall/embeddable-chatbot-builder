#!/usr/bin/env bash
# Generates a 256-bit key for AES-256-GCM encryption of BYOK provider API keys.
# Usage: ./scripts/generate-aes-key.sh
# Copy the output into AES_MASTER_KEY in your .env — never commit it.
set -euo pipefail
openssl rand -base64 32
