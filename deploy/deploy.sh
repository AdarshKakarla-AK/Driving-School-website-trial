#!/usr/bin/env bash
# Sri Mathru — one-command deploy with docker compose.
# Reads secrets from .env at the repo root (see deploy/.env.production.example).
#
#   ./deploy/deploy.sh            # build local image + up web & scheduler
#   ./deploy/deploy.sh --release  # pull the latest GHCR image instead of building

set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--release" ]; then
  docker compose pull web
  docker compose up -d --no-deps web
  docker compose up -d scheduler
else
  docker compose up -d --build web scheduler
fi

echo
echo "Deployed. Verify:"
echo "  docker compose ps"
echo "  curl -fsS http://127.0.0.1:3000/api/health"
