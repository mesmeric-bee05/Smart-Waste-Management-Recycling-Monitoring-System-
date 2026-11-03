# Deployment and release readiness

## Status

The repository includes a standalone Next.js Node Dockerfile and a gated migration path. GitHub Actions run [40860929510](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/actions/runs/40860929510) validated the three approved migrations against an isolated PostgreSQL 16 service. The follow-up with safer direct-URI validation and regression coverage was merged at [`17c94e32e7b972f259dce29674a10dd0a423dd14`](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/commit/17c94e32e7b972f259dce29674a10dd0a423dd14); exact GitHub Actions run [41182161829](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/actions/runs/41182161829) passed application checks, full-history secret scanning, and runtime container smoke. These runs are historical CI evidence, not Production evidence.

Earlier attempts to start checkpoint `fa209835d14a5bc95a72cf0770e89464bd755f4b` failed while parsing the then-configured runtime URL and, on a later attempt, the migration URL. They failed before any database connection; no Production migration, seed, administrator creation, or successful health check was observed from those attempts. On 2026-11-03, the user replaced both Production PostgreSQL URL values using the protected input card and explicitly authorized a new Production publication with exactly the three approved additive migrations, despite the open security and operations gates listed below. The replacement values have not been exposed to the application in a verified deployment yet, so their actual syntax, endpoint, credentials, TLS, and role privileges remain unverified. No outcome for the newly authorized attempt is claimed in this guide until deployment evidence is available.

The bound WebDev project stores the container declaration (`Dockerfile`, health path `/api/health`) and has `publishing.auto_publish` enabled. Advancing canonical `main` records a checkpoint and triggers automatic publication. The specified public GitHub repository is a separate destination; the WebDev project remains bound to its Manus-managed repository. Do not confuse a GitHub push, local build, or Preview health response with a successful Production deployment.

The application expects a customer-provisioned external PostgreSQL database. It does not provision PostgreSQL. The WebDev managed database capability is MySQL-compatible and is not connected to this PostgreSQL application; it must not be substituted.

## Container

`Dockerfile` uses Node 22 on Debian, installs locked dependencies, generates Prisma and compiles Next standalone output, then runs the startup entrypoint as the unprivileged Node image user on `0.0.0.0:$PORT` (default 3000). It supplies a dummy build-only `POSTGRES_DATABASE_URL` and a non-secret build-only Auth value; image construction performs no live DB query. Do not change those build placeholders into customer credentials. `/api/health` is unauthenticated and returns a constant-status success only when PostgreSQL responds to a bounded `SELECT 1`; it does not expose the error, URL or secret and does not verify application migrations or account provisioning. Local Preview returned `status: ok`; this is Development-only evidence, not Production health evidence.

## Gated first-run schema initialization

`WASTEOPS_RUN_INITIAL_MIGRATIONS` is off by default. Only the exact value `true` enables the initial migration gate. For the newly authorized Production attempt, the user-enabled gate is present. An enabled gate requires both `POSTGRES_DATABASE_URL` and the separate `POSTGRES_MIGRATION_DATABASE_URL`. They must identify the same host, port, database, and schema; Production also requires explicit, distinct database role names. The newly supplied protected URL values have not yet been validated against PostgreSQL.

Before applying anything, the runner verifies the exact three approved migration directories, their pinned SQL SHA-256 hashes, and PostgreSQL migration provider. It rejects unknown, partial, duplicate, failed, or rolled-back ledger history and an uninitialized schema containing unrelated tables, views, or sequences. It compares each successful applied `_prisma_migrations.checksum` with the pinned hash before accepting an already-complete baseline; mismatches fail closed. It invokes only `prisma migrate deploy` using the migration URL in a short-lived CLI subprocess, never calls a seed or executes custom data SQL, and verifies all three successful ledger rows before starting Next.js. Once the approved baseline is complete, later gated starts skip migration only after that checksum comparison. Any unexpected or changed migration set fails closed. The container entrypoint removes the gate flag, migration URL, and unused managed-MySQL `DATABASE_URL`/`DRIZZLE_DATABASE_URL` from the Next.js process environment before launching the app.

The gate does not provision database roles or application-table grants. The runtime role must have only the required DML and sequence access on application tables, no schema DDL or ownership privileges, and no access to `public._prisma_migrations`. CI proves this boundary in an isolated database; Production role grants remain unverified. After a successful approved baseline, remove the Production-only migration gate and stored migration URL and revoke the temporary migration role through the database operator. Keep the runtime URL in place.

## Runtime values and cookie policy

Production values must be supplied through the protected secret manager; never commit them or put them in a public compose file:

- `POSTGRES_DATABASE_URL`: the application's PostgreSQL URL, using certificate-validated TLS, network ACLs, connection-pool limits compatible with live instances, and a least-privilege runtime role with DML/sequence access only on application tables. It must not own schemas, create DDL, or read/write `public._prisma_migrations`.
- `POSTGRES_MIGRATION_DATABASE_URL`: a separate, protected Production-only URL for the one-time migration role. Its role must be distinct from the runtime role, have only required schema-migration privileges, and target the exact same host, port, database, and schema. The replacement value was supplied via protected input on 2026-11-03; its endpoint and privileges have not yet been verified.
- `AUTH_SECRET`: at least 32 random bytes generated and stored outside the image. Rotate through a controlled session-invalidation procedure.
- `WASTEOPS_RUN_INITIAL_MIGRATIONS`: optional protected Production-only exact string `true` for the one-time approved baseline; keep unset/off otherwise and remove it after success.
- Hosted production defaults to `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=lax`. The embedded public-HTTPS Preview uses explicit `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none`; plain-HTTP localhost may opt out using the example's local-only `false/lax` values. Never infer cookie policy from `NODE_ENV` or an internal proxy request.
- `PORT`: container port if the platform supplies one (defaults to 3000); monitor `/api/health`.

A database URL must be a direct URI such as `postgresql://<role>:<percent-encoded-password>@<host>:5432/<database>?sslmode=require&schema=public` (or a provider-supported `postgres://` form). Enter the raw URI value only—do not include `POSTGRES_DATABASE_URL=`, `POSTGRES_MIGRATION_DATABASE_URL=`, quotes, shell commands, or whitespace. Percent-encode reserved characters in the username/password. Do not send credentials in chat. The runtime and migration URIs must use different Production roles but target the same database/schema.

Do not run `npm run db:seed` in Production. Set role/site admin lifecycle through a reviewed operator process. The current invitation workflow has no external mail provider, account-verification or password-reset channel; evaluate it before operational use. Public self-registration is intentionally disabled.

## Remaining Production security and operations gates

The user explicitly authorized the current release attempt despite these open items. Their acceptance authorizes the requested attempt; it does not mean the items below have been verified or remediated:

- Approve a supported identity path and its callback URLs, MFA for privileged users where supported, recovery, revocation, and account lifecycle. The current Auth.js dependency is a beta prerelease and has no self-service password reset or account verification.
- Provision distinct least-privilege runtime and migration roles. Verify both protected URLs target the same intended PostgreSQL endpoint/schema and use certificate-validated TLS and appropriate network ACLs. Confirm runtime access excludes `_prisma_migrations`. Confirm backups and a restore exercise.
- Provision the initial administrator through a reviewed, secure operator process; do not use fictional demo accounts or the seed command in Production.
- Replace the process-local limiter with shared enforcement and test client-IP handling behind the actual trusted proxy. The current forwarded-IP source may be spoofable if ingress does not overwrite it.
- Verify embedded-Preview cookies separately from ordinary same-site hosting; test CSP against actual map-tile and deployment origins.
- Confirm OpenStreetMap tile usage, attribution, and any commercial SLA before Production traffic.
- Review audit-trigger/role ownership and immutability needs; add external archival/retention if required.
- Complete customer-specific privacy and security review, WCAG review, load/connection-budget testing, user acceptance using customer-approved data, and operator training. Agree how simulation labels and the illustrative CO₂ factor will be presented.
- Set up deployment-secret rotation, CI protection/approval policy, schema migration ordering, logs/metrics/error alerts, backup/restore, rollback and incident-contact ownership.

The full dependency tree passed `npm audit --audit-level=moderate` after pinning installed `minimatch` copies to `11.0.3`; the Production-only audit also reports zero vulnerabilities. Keep the moderate-or-higher threshold in CI, retest the lint toolchain after dependency changes, and rerun audits before releases.

## Release sequence and current attempt

1. Build and test a commit against isolated PostgreSQL using distinct runtime/migration roles (`npm ci`, `npm run db:generate`, `npm run db:deploy`, and the checks in `docs/TESTING.md`).
2. The user has replaced both protected Production URL values and reauthorized the current publication with exactly the three approved additive migrations on 2026-11-03. The next accepted canonical-main checkpoint will trigger auto-publication. The runner must continue to fail closed if URLs do not parse or match, roles are not distinct, endpoint access fails, the schema is unsafe, or migration history/hashes differ.
3. If all gate conditions pass and the migration completes, verify its exact ledger/checksum result and Production health. Then remove the Production-only gate and stored migration-role URL, and revoke that temporary database role through the database operator. Never run local test commands or seed data against Production.
4. Verify authentication and tenant boundaries, map attribution, reports, and audit outcomes using a designated non-Production tenant.
5. Promote operational use only after identity, acceptance and restore/recovery requirements have been addressed; preserve a previous image and compatible schema for rollback.

At the time of this revision, the current Production attempt is authorized but has not yet been verified. The old failed attempt made no database changes. No Production connection, migration, seed, initial-Admin provisioning, successful health check, or live deployment is claimed until evidence from the new attempt confirms it.
