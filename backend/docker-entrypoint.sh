#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  : "${DATABASE_URL:?Defina DATABASE_URL para persistencia em producao}"
  : "${JWT_SECRET:?Defina JWT_SECRET em producao}"
  : "${REFRESH_SECRET:?Defina REFRESH_SECRET em producao}"
  node -e "require('./dist/config/environment')"
fi

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma migrations..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] DATABASE_URL not set — running in InMemory mode (no DB)."
fi

echo "[entrypoint] Starting CryoFlix backend on port ${PORT:-4000}..."
exec "$@"
