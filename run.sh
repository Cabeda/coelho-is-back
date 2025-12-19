#!/bin/sh
set -e

echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

# Ensure DATABASE_URL is set for migrations
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/stopwatch.db"
fi

echo "Using DATABASE_URL: $DATABASE_URL"

# Run database migrations/push
echo "Running database push..."
# Use the prisma binary from node_modules if available, otherwise use npx
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "Using local prisma binary..."
  ./node_modules/.bin/prisma db push --accept-data-loss
else
  echo "Using npx prisma..."
  npx prisma db push --accept-data-loss
fi

# Start the application
echo "Starting application on 0.0.0.0:3000..."
# Next.js standalone server uses HOSTNAME and PORT env vars
node server.js
