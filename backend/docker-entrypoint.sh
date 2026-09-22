#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" != "false" ]; then
  echo "Seeding database (no-op if data already present)..."
  npx tsx prisma/seed.ts || echo "Seed skipped/failed (continuing startup)"
fi

exec "$@"
