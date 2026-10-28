# Deployment and release readiness

## Status

The repository includes a standalone Next.js Node Dockerfile, and the optimized Next.js application build passed. A container image build was not verified because this sandbox has no Docker CLI/daemon. No customer domain, approved identity provider, PostgreSQL provider, secret manager, backup service, monitoring, or production account was supplied/configured. The Manus-managed WebDev database capability is MySQL-compatible while this code deliberately uses PostgreSQL; it is not connected to the managed database. This project has not been published as a live production service. Use fictional local/CI data only until the gates below are met.

## Container

`Dockerfile` uses Node 22 on Debian, runs `npm ci`, generates Prisma and compiles Next standalone output, then runs `node server.js` as the unprivileged Node image user on `0.0.0.0:$PORT` (default 3000). It supplies a dummy build-only `POSTGRES_DATABASE_URL` and a non-secret build-only Auth value; image construction performs no live DB query. Do not change those build placeholders into customer credentials. `/api/health` is unauthenticated and returns a constant-status success only when PostgreSQL responds to a bounded `SELECT 1`; it does not expose the error, URL or secret.

Set at runtime (through a secret manager; never in a public compose file):

- `POSTGRES_DATABASE_URL`: a PostgreSQL URL with certificate-validated TLS, network ACL, connection pool limits compatible with the number of live application instances, and a separately provisioned least-privilege role. The normal migration operator must use a separate role.
- `AUTH_SECRET`: at least 32 random bytes generated and stored outside the image. Rotate through a controlled session invalidation procedure.
- `AUTH_COOKIE_SECURE=true`. For a same-site HTTPS production domain, `AUTH_COOKIE_SAME_SITE=lax` is the recommended starting point; only embedded cross-site HTTPS Preview requires `none`.
- `PORT`: container port if the platform supplies one (defaults to 3000); monitor `/api/health`.

Do not run `npm run db:seed` in production. Set role/site admin lifecycle through a reviewed operator process. The current invitation workflow has no external mail provider, account-verification or password-reset channel; evaluate it before operational use.

## Before a first live release

- Resolve the prerelease authentication dependency and document the chosen provider/callback URLs/MFA/recovery/account-lockout configuration.
- Provision the actual PostgreSQL instance, TLS, migration/runtime credentials, access controls, backups, restore proof, retention/deletion policy and alerts.
- Replace process-local rate limiting with shared enforcement, and test behind the actual trusted proxy.
- Verify embedded-preview cookie settings separately from ordinary same-site hosting; test CSP against the real map tile and deployment origins.
- Confirm OpenStreetMap tile usage/attribution suitability and any commercial SLA before production traffic.
- Review audit trigger/role ownership and database immutability requirements; add external archival/retention if necessary.
- Complete a security assessment, WCAG review, load/connection-budget test, user acceptance test with customer-approved data, and operator training. Agree how simulation labels and the illustrative CO₂ factor will be displayed.
- Set up deployment secrets, CI protection/approval policy, schema migration ordering, logs/metrics/error alerting, backup/restore, rollback and incident contact ownership.

## Release sequence

1. Build/test a commit against an isolated PostgreSQL environment (`npm ci`, `npm run db:generate`, `npm run db:deploy`, checks in `docs/TESTING.md`).
2. Apply reviewed additive migration via the migration identity; verify backup first. Never point local test commands at production.
3. Deploy a container with runtime-only secrets. During rolling upgrades, maintain backward-compatible schema until every older instance is drained.
4. Check generic `/api/health`, authentication and tenant boundaries, map attribution, reports and audit outcomes using a designated non-production tenant.
5. Promote only after acceptance and restore/recovery requirements pass; preserve previous image and compatible schema for rollback.

No deploy, domain, or public release was performed as part of this repository code task.
