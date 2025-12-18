#!/bin/sh
set -e

# Run database migrations/push
echo "Running database push..."
# Use the prisma binary from node_modules if available, otherwise use npx
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --accept-data-loss
else
  npx prisma db push --accept-data-loss
fi

# Start the application
echo "Starting application..."
node server.js
