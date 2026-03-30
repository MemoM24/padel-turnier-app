#!/bin/sh
set -e

echo "[start] Running database migrations..."

# Run drizzle migrations (creates tables if they don't exist)
if [ -n "$DATABASE_URL" ]; then
  pnpm drizzle-kit migrate || {
    echo "[start] Migration failed, trying generate + migrate..."
    pnpm drizzle-kit generate && pnpm drizzle-kit migrate || {
      echo "[start] WARNING: Migrations failed, starting server anyway..."
    }
  }
else
  echo "[start] No DATABASE_URL set, skipping migrations"
fi

echo "[start] Starting server..."
exec node dist/index.js
