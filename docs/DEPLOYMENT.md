# Deployment and release readiness

## Status

The repository includes a standalone Next.js Node Dockerfile and the gated migration path was verified by GitHub Actions run [40860929510](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/actions/runs/40860929510) on target merge `0316cc0a25765095196afe65476ef6b42dc80117`, using only a disposable PostgreSQL 16 service. Subsequent docs-only GitHub Actions run [40861874402](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/actions/runs/40861874402) on target commit `f67113c06d5259301376fe0d1c0b11348d312ddc` also passed all three jobs against the same application source. The source now also contains safer direct-URI validation and a regression test; those follow-up changes are locally verified but not included in either target run. The bound WebDev project stores the container declaration (`Dockerfile`, health path `/api/health`), resolving the missing-deploy contract.

The protected Production scope contains `POSTGRES_DATABASE_URL`, `AUTH_SECRET`, `POSTGRES_MIGRATION_DATABASE_URL`, and the user-enabled initial-migration gate. The values remain hidden and have not been copied into the repository or development environment. Authorized startup attempts for exact checkpoint `fa209835d14a5bc95a72cf0770e89464bd755f4b` failed during URL validation: earlier attempts rejected `POSTGRES_DATABASE_URL`; the latest retry passed that parser but rejected `POSTGRES_MIGRATION_DATABASE_URL`. These checks occur before a database connection. No Production connection, migration, seed, initial Admin creation, successful Production health check, or successful live deployment has been verified. The latest migration-URL replacement card was canceled; this guide does not request another secret or authorize another publish.

Production input presence does not prove endpoint reachability, valid credentials, TLS/network configuration, schema readiness, or administrator provisioning. The project uses the user-selected external PostgreSQL application database; it does not provision a hosted PostgreSQL instance. The WebDev managed database capability is MySQL-compatible and is not connected to this PostgreSQL application; it must not be substituted.

## Container

`Dockerfile` uses Node 22 on Debian, installs locked dependencies, generates Prisma and compiles Next standalone output, then runs the startup entrypoint as the unprivileged Node image user on `0.0.0.0:$PORT` (default 3000). It supplies a dummy build-only `POSTGRES_DATABASE_URL` and a non-secret build-only Auth value; image construction performs no live DB query. Do not change those build placeholders into customer credentials. `/api/health` is unauthenticated and returns a constant-status success only when PostgreSQL responds to a bounded `SELECT 1`; it does not expose the error, URL or secret and does not verify application migrations or account provisioning. In the confirmed local Preview, the same route returned `status: ok`; this is Development-only evidence, not Production health evidence.

## Gated first-run schema initialization

`WASTEOPS_RUN_INITIAL_MIGRATIONS` is off by default. Only an exact `true` enables the initial migration gate. The user set the Production gate true for the approved release attempt. An enabled gate requires both the runtime `POSTGRES_DATABASE_URL` and the separate `POSTGRES_MIGRATION_DATABASE_URL`. They must identify the same host, port, database, and schema; Production also requires explicit, distinct database role names. The latest Production startup failed while parsing the migration URL, before any DB client connected. The application's current preflight message now gives format guidance without returning the supplied value; a unit regression covers environment-assignment input.

Before applying anything, the runner verifies the exact three approved migration directories, their pinned SQL SHA-256 hashes, and PostgreSQL migration provider; it rejects unknown, partial, duplicate, failed, or rolled-back ledger history and an uninitialized schema containing unrelated tables, views, or sequences. It invokes only `prisma migrate deploy` using the migration URL in a short-lived CLI subprocess, never calls a seed or executes custom data SQL, and verifies all three successful `_prisma_migrations` rows before starting Next.js. Once the approved baseline is complete, later gated starts skip migration. Any unexpected/changed migration set fails closed. The container entrypoint removes the gate flag, migration URL, and unused managed-MySQL `DATABASE_URL`/`DRIZZLE_DATABASE_URL` from the Next.js process environment before launching the app. After the first approved migration, withdraw the Production-only gate and migration-role secret; later schema changes require a separately reviewed migration process.

The gate does not provision database roles or application-table grants. Before any release, establish that the runtime role has only the required DML and sequence access on application tables, has no schema DDL/ownership privileges, and cannot access `public._prisma_migrations`. Do not use broad default DML grants that include the migration ledger. CI proves this boundary in an isolated database; Production role grants remain unverified.

## Runtime values and cookie policy

Set the following at runtime through the protected Production secret manager; never commit them or place them in a public compose file:

- `POSTGRES_DATABASE_URL`: the application's PostgreSQL URL, using certificate-validated TLS, network ACLs, connection-pool limits compatible with live instances, and a least-privilege runtime role with DML/sequence access only on application tables. It must not own schemas, create DDL, or read/write `public._prisma_migrations`.
- `POSTGRES_MIGRATION_DATABASE_URL`: a separate, protected Production-only URL for the one-time migration role. Its role must be distinct from the runtime role, have only the required schema-migration privileges, and target the exact same host/port/database/schema. The protected value is present, but the latest startup rejected its URL format and the latest replacement-input card was canceled. The database provider/operator must supply this credential; the application cannot safely generate a database role or provider connection URL. After a successful approved baseline migration, withdraw the gate and migration-role secret.
- `AUTH_SECRET`: at least 32 random bytes generated and stored outside the image. Rotate through a controlled session-invalidation procedure.
- `WASTEOPS_RUN_INITIAL_MIGRATIONS`: optional protected Production-only exact string `true` for the one-time approved baseline; keep unset/off otherwise and remove it after success.
- Hosted production defaults to `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=lax`. For the embedded public-HTTPS Preview, the Preview process uses explicit `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none`; plain-HTTP localhost may opt out using the example's local-only `false/lax` values. Never infer cookie policy from `NODE_ENV` or an internal proxy request.
- `PORT`: container port if the platform supplies one (defaults to 3000); monitor `/api/health`.

A database URL must be a direct URI such as `postgresql://<role>:<percent-encoded-password>@<host>:5432/<database>?sslmode=require&schema=public` (or a provider-supported `postgres://` form). Enter the raw URI value only—do not include `POSTGRES_DATABASE_URL=` or `POSTGRES_MIGRATION_DATABASE_URL=`, quotes, shell commands, or whitespace. Percent-encode reserved characters in the username/password. Do not send credentials in chat. The runtime and migration URIs must use different Production roles but target the same database/schema.

Do not run `npm run db:seed` in production. Set role/site admin lifecycle through a reviewed operator process. The current invitation workflow has no external mail provider, account-verification or password-reset channel; evaluate it before operational use. Public self-registration is intentionally disabled.

## Before a first live release

- Resolve the prerelease authentication dependency and document the chosen provider/callback URLs/MFA/recovery/account-lockout configuration.
- Provision distinct least-privilege runtime and migration roles; verify both protected URLs point to the same intended PostgreSQL endpoint/schema and have certificate-validated TLS and suitable network ACLs. Grant the runtime role only the application-table and sequence permissions it needs, with no access to `_prisma_migrations`; do not grant broad DML default privileges that include the ledger. Confirm backups and restore proof before the gate is enabled. Do not test by pointing local or E2E commands at Production.
- Provision the initial administrator through a reviewed, secure operator process; do not use fictional demo accounts or the seed command in Production.
- Replace process-local rate limiting with shared enforcement, and test behind the actual trusted proxy.
- Verify embedded-preview cookie settings separately from ordinary same-site hosting; test CSP against the real map tile and deployment origins.
- Confirm OpenStreetMap tile usage/attribution suitability and any commercial SLA before production traffic.
- Review audit trigger/role ownership and database immutability requirements; add external archival/retention if necessary.
- Complete a security assessment, WCAG review, load/connection-budget test, user acceptance test with customer-approved data, and operator training. Agree how simulation labels and the illustrative CO₂ factor will be displayed.
- Set up deployment secrets, CI protection/approval policy, schema migration ordering, logs/metrics/error alerting, backup/restore, rollback and incident contact ownership.
- Resolve the full-tree development-tooling audit findings safely; the Production dependency audit currently reports zero vulnerabilities. Do not apply a blanket incompatible major-version override.

## Release sequence

1. Build/test a commit against isolated PostgreSQL using distinct runtime/migration roles (`npm ci`, `npm run db:generate`, `npm run db:deploy`, checks in `docs/TESTING.md`).
2. After the failed authorized attempt is resolved, use the corrected protected migration URL and obtain fresh approval for the exact target checkpoint before enabling/publishing. Review the migration ledger and Production health result, then withdraw the gate and migration-role URL. Never run local test commands or seed data against Production.
3. Deploy the application with only its least-privilege runtime URL. During rolling upgrades, maintain backward-compatible schema until every older instance is drained.
4. Check generic `/api/health`, authentication and tenant boundaries, map attribution, reports and audit outcomes using a designated non-production tenant.
5. Promote only after acceptance and restore/recovery requirements pass; preserve previous image and compatible schema for rollback.

The deployment contract is stored, and protected Production inputs are present, but the approved attempts for version `fa209835d14a5bc95a72cf0770e89464bd755f4b` failed at URL validation before any database connection. The user-authorized additive migration set has not executed; no Production schema, seed, or administrator is verified, and no successful live deployment is confirmed. The replacement migration-URL card was canceled. Do not retry or advance the auto-publishing canonical `main` without a corrected protected URI and renewed explicit authorization for the exact release. Local Preview health and isolated-CI migration success do not prove Production readiness.
