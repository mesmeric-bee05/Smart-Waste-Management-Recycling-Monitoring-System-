# Deployment and release readiness

## Status

The repository includes a standalone Next.js Node Dockerfile and the optimized application build passes. The production container image and gated-migration smoke passed GitHub Actions run [40860929510](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/actions/runs/40860929510) on target merge `0316cc0a25765095196afe65476ef6b42dc80117`; that workflow used only its disposable PostgreSQL 16 service. It did not connect to the protected Production database. The bound WebDev project stores the container declaration (`Dockerfile`, health path `/api/health`), resolving the missing-deploy contract but not itself publishing the project.

The WebDev config confirms `POSTGRES_DATABASE_URL` and `AUTH_SECRET` are present in the protected **Production** scope. Their values remain hidden and are not stored in the repository or copied into the development environment. Presence does not prove that the external PostgreSQL endpoint is reachable, TLS/network controls are correct, the schema is migrated, or an initial administrator has been provisioned. The separate protected migration-role URL is not configured. The project's managed WebDev database capability is MySQL-compatible and is not connected to this PostgreSQL application; it must not be substituted.

No customer domain, stable production identity/recovery policy, backup/restore evidence, monitoring, or customer UAT has been confirmed. The project has not been published as a live production service. The bound WebDev project's `publishing.auto_publish` is enabled: advancing its canonical `main` checkpoint would request deployment. Do not push that checkpoint until the database/schema/admin gates are confirmed and the user separately authorizes the exact live release. Use fictional local/CI data only until then.

## Container

`Dockerfile` uses Node 22 on Debian, installs locked dependencies, generates Prisma and compiles Next standalone output, then runs the startup entrypoint as the unprivileged Node image user on `0.0.0.0:$PORT` (default 3000). It supplies a dummy build-only `POSTGRES_DATABASE_URL` and a non-secret build-only Auth value; image construction performs no live DB query. Do not change those build placeholders into customer credentials. `/api/health` is unauthenticated and returns a constant-status success only when PostgreSQL responds to a bounded `SELECT 1`; it does not expose the error, URL or secret and does not verify application migrations or account provisioning.

## Gated first-run schema initialization

`WASTEOPS_RUN_INITIAL_MIGRATIONS` is off by default. Only an exact `true` enables the initial migration gate. An enabled gate requires both the runtime `POSTGRES_DATABASE_URL` and the separate `POSTGRES_MIGRATION_DATABASE_URL`. They must identify the same host, port, database, and schema; Production also requires explicit, distinct database role names. The current protected Production inputs do not yet include the migration URL, and no Production connection or migration has been attempted.

Before applying anything, the runner verifies the exact three approved migration directories, their pinned SQL SHA-256 hashes, and PostgreSQL migration provider; it rejects unknown, partial, duplicate, failed, or rolled-back ledger history and an uninitialized schema containing unrelated tables, views, or sequences. It invokes only `prisma migrate deploy` using the migration URL in a short-lived CLI subprocess, never calls a seed or executes custom data SQL, and verifies all three successful `_prisma_migrations` rows before starting Next.js. Once the approved baseline is complete, later gated starts skip migration. Any unexpected/changed migration set fails closed. The container entrypoint removes the gate flag, migration URL, and unused managed-MySQL `DATABASE_URL`/`DRIZZLE_DATABASE_URL` from the Next.js process environment before launching the app. After the first approved migration, withdraw the Production-only gate and migration-role secret; later schema changes require a separately reviewed migration process.

The gate does not provision database roles or application-table grants. Before any release, establish that the runtime role has only the required DML and sequence access on application tables, has no schema DDL/ownership privileges, and cannot access `public._prisma_migrations`. Do not use broad default DML grants that include the migration ledger. CI proves this boundary in an isolated database; Production role grants remain unverified.

## Runtime values and cookie policy

Set the following at runtime through the protected Production secret manager; never commit them or place them in a public compose file:

- `POSTGRES_DATABASE_URL`: the application's PostgreSQL URL, using certificate-validated TLS, network ACLs, connection-pool limits compatible with live instances, and a least-privilege runtime role with DML/sequence access only on application tables. It must not own schemas, create DDL, or read/write `public._prisma_migrations`.
- `POSTGRES_MIGRATION_DATABASE_URL`: a separate, protected Production-only URL for the one-time migration role. Its role must be distinct from the runtime role, have only the required schema-migration privileges, and target the exact same host/port/database/schema. This key is not configured yet; request it through protected input only when the user is ready for the separately authorized first release. The entrypoint does not pass it to the Next.js process, and it must be withdrawn after the approved baseline is applied.
- `AUTH_SECRET`: at least 32 random bytes generated and stored outside the image. Rotate through a controlled session-invalidation procedure.
- Hosted production defaults to `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=lax`. For the embedded public-HTTPS Preview, the Preview process uses explicit `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none`; plain-HTTP localhost may opt out using the example's local-only `false/lax` values. Never infer cookie policy from `NODE_ENV` or an internal proxy request.
- `PORT`: container port if the platform supplies one (defaults to 3000); monitor `/api/health`.

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

## Release sequence

1. Build/test a commit against isolated PostgreSQL using distinct runtime/migration roles (`npm ci`, `npm run db:generate`, `npm run db:deploy`, checks in `docs/TESTING.md`).
2. After separate release approval, provide the matching protected migration URL and enable the one-time gate only for the confirmed target; review the migration ledger and health result, then withdraw the gate and migration-role URL. Never run local test commands or seed data against Production.
3. Deploy the application with only its least-privilege runtime URL. During rolling upgrades, maintain backward-compatible schema until every older instance is drained.
4. Check generic `/api/health`, authentication and tenant boundaries, map attribution, reports and audit outcomes using a designated non-production tenant.
5. Promote only after acceptance and restore/recovery requirements pass; preserve previous image and compatible schema for rollback.

The deployment declaration is stored and the protected runtime `POSTGRES_DATABASE_URL` and `AUTH_SECRET` are present, but the separate migration-role URL is not configured. The exact gated-migration CI run passed on disposable PostgreSQL only; no publish, Production connection, migration, or seed has been started. The user authorized the additive migration set and explicitly requires a separate confirmation before publishing. Production release remains held until endpoint/role readiness, runtime-table grants, reviewed migration baseline, initial administrator provisioning, approved authentication, and the checks above are verified and live publication is separately authorized.
