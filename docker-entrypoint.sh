#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-file:/app/data/prod.db}"

echo "[entrypoint] Aplicando migrações..."
npx prisma migrate deploy

echo "[entrypoint] Rodando seed (idempotente)..."
npx tsx prisma/seed.ts

echo "[entrypoint] Iniciando aplicação..."
exec "$@"
