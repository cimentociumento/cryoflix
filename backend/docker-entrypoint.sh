#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma migrations..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] DATABASE_URL not set — running in InMemory mode (no DB)."
fi

echo "[entrypoint] Starting CryoFlix backend on port ${PORT:-4000}..."
exec "$@"
