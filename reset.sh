#!/usr/bin/env bash
# Reset the lab target to its seeded baseline.
# Wipes the data volume (DB + uploads) and rebuilds, so every run starts
# from the identical fixture in seed.sql.
set -euo pipefail

cd "$(dirname "$0")"

# Pick whichever compose invocation is available.
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

echo "[reset] tearing down (including data volume)…"
$DC down -v --remove-orphans

echo "[reset] building and starting…"
$DC up -d --build

echo "[reset] waiting for health…"
for i in $(seq 1 30); do
  if curl -fsS http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "[reset] up: http://localhost:8080  (health ok after ${i}s)"
    exit 0
  fi
  sleep 1
done

echo "[reset] WARNING: health check did not pass within 30s; check 'docker compose logs'."
exit 1
