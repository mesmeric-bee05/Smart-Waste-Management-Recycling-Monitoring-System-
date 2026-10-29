#!/bin/sh
set -eu

node /app/scripts/run-initial-migrations.mjs
# This application intentionally uses external PostgreSQL, not the platform's MySQL database.
unset POSTGRES_MIGRATION_DATABASE_URL WASTEOPS_RUN_INITIAL_MIGRATIONS DATABASE_URL DRIZZLE_DATABASE_URL
exec node /app/server.js
