# Developer and operator runbook

## Start the local demo

Use the Windows PowerShell instructions in [README.md](../README.md). The Compose database listens only on `127.0.0.1:5432` with fictional data and a development password. Copy `.env.example` to `.env`, create a new Auth secret and three unique demo passwords, then run `npm ci`, `npm run db:generate`, `npm run db:deploy`, `npm run db:seed`, and `npm run dev`.

The health route tests database connectivity but returns only `{ "status": "ok" }` or `{ "status": "unavailable" }` with `Cache-Control: no-store`; it does not return a URL, query error or secret. A failed health check means inspect the container, environment and migrations without printing credential values.

## Sample data and identities

The seed uses only `example.test` emails, fictional labels/addresses, synthetic coordinate patterns and clearly SIMULATED telemetry/vehicle pings. The idempotent demo seed upserts the three configured users and 50 sample points, creates up to 250 fictional collections and fills idempotent seven-day readings/pings. It requires all three passwords (12+ chars) and hashes with Argon2id. It can be rerun against the local demo tenant; do not run it on a shared or production database. Seeded demo point coordinates stay marked SIMULATED until an authorized editor checks them and explicitly attests before marking them MANUAL.

Never put names, emails, precise real addresses, device identifiers or API tokens into demo fixtures or support screenshots. Public requests can contain personal contact data if a user types it; restrict staff visibility, set retention and use a disposable tenant for testing.

## Cookies and embedded Preview

For `http://localhost`, set `AUTH_COOKIE_SECURE=false` and `AUTH_COOKIE_SAME_SITE=lax`. For the public HTTPS Manus Preview iframe, set `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none` using the environment appropriate to that preview. A normal first-party HTTPS deployment should use Secure with SameSite Lax unless an actual cross-site identity flow needs otherwise. Do not toggle these based on `NODE_ENV` or internal `req.secure`. Browser-level third-party-cookie restrictions can still block iframe sessions; a separate-tab flow may be necessary.

## Routine checks

Run format, lint, typecheck, unit tests, E2E/accessibility suite and `npm audit --audit-level=high` before review. Verify `/manus-routes.json` returns JSON matching the current App Router pages. Review migration SQL, package-lock diff and CI results before merging. Check Dependabot/security alerts weekly and upgrade one coherent package group at a time.

## Data operations and recovery

Local Docker data is disposable demo data. `docker compose down` stops the local Postgres while preserving the named volume. `docker compose down -v` deletes that local volume; use only for deliberate reset. Production backup retention, restore testing and deletion are provider/operator responsibilities; the repo does not configure them. Restore to an isolated instance and validate before directing application traffic.

Use the organization-scoped audit viewer to examine actor/action/time/target without dumping request messages or raw metadata. The database trigger rejects updates/deletes by ordinary DB writes. Only a controlled database owner/migration operator should alter schema or handle restore/retention. Capture incident facts externally before rotating credentials; do not alter audit rows to conceal an incident.

## Current operational limitations

Rate limiting is process-local and therefore not authoritative across more than one server instance. Auth.js v5 is a prerelease. No MFA, password-reset/email delivery, SMS, external alerting, offline sync, telemetry ingestion, scheduler, WORM audit archive, SLA monitoring or customer identity provisioning is configured. Treat this as a software MVP until production-readiness work is approved.
