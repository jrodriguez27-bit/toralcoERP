#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Running database seed..."
node ./prisma/compiled/seed.js || echo "Seed already applied or skipped."

echo "Starting application..."
exec node server.js
