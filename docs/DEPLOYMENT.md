# Deployment and release readiness

## Status

The repository includes a standalone Next.js Node Dockerfile, and the optimized application build passed after the latest 3D/accessibility changes. A container image was previously built and smoke-tested in GitHub Actions; this sandbox has no Docker CLI/daemon. The bound WebDev project stores the container declaration (`Dockerfile`, health path `/api/health`), which resolves the missing-deploy contract but is not itself a publish.

The WebDev config confirms `POSTGRES_DATABASE_URL` and `AUTH_SECRET` are present in the protected **Production** scope. Their values remain hidden and are not stored in the repository or copied into the development environment. Presence does not prove that the external PostgreSQL endpoint is reachable, TLS/network controls are correct, the schema is migrated, or an initial administrator has been provisioned. These production checks remain unverified. The project's managed WebDev database capability is MySQL-compatible and is not connected to this PostgreSQL application; it must not be substituted.

No customer domain, stable production identity/recovery policy, backup/restore evidence, monitoring, or customer UAT has been confirmed. The project has not been published as a live production service. The bound WebDev project's `publishing.auto_publish` is enabled: advancing its canonical `main` checkpoint would request deployment. Do not push that checkpoint until the database/schema/admin gates are confirmed and the user explicitly authorizes live release. Use fictional local/CI data only until then.

## Container

`Dockerfile` uses Node 22 on Debian, runs `npm ci`, generates Prisma and compiles Next standalone output, then runs `node server.js` as the unprivileged Node image user on `0.0.0.0:$PORT` (default 3000). It supplies a dummy build-only `POSTGRES_DATABASE_URL` and a non-secret build-only Auth value; image construction performs no live DB query. Do not change those build placeholders into customer credentials. `/api/health` is unauthenticated and returns a constant-status success only when PostgreSQL responds to a bounded `SELECT 1`; it does not expose the error, URL or secret and does not verify application migrations or account provisioning.

## Runtime values and cookie policy

Set the following at runtime through the protected Production secret manager; never commit them or place them in a public compose file:

- `POSTGRES_DATABASE_URL`: a PostgreSQL URL with certificate-validated TLS, network ACL, connection-pool limits compatible with the number of live application instances, and a separately provisioned least-privilege application role. The normal migration operator must use a separate role.
- `AUTH_SECRET`: at least 32 random bytes generated and stored outside the image. Rotate through a controlled session-invalidation procedure.
- Hosted production defaults to `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=lax`. For the embedded public-HTTPS Preview, the Preview process uses explicit `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none`; plain-HTTP localhost may opt out using the example's local-only `false/lax` values. Never infer cookie policy from `NODE_ENV` or an internal proxy request.
- `PORT`: container port if the platform supplies one (defaults to 3000); monitor `/api/health`.

Do not run `npm run db:seed` in production. Set role/site admin lifecycle through a reviewed operator process. The current invitation workflow has no external mail provider, account-verification or password-reset channel; evaluate it before operational use. Public self-registration is intentionally disabled.

## Before a first live release

- Resolve the prerelease authentication dependency and document the chosen provider/callback URLs/MFA/recovery/account-lockout configuration.
- Verify PostgreSQL endpoint reachability, certificate validation, network ACLs, migration/runtime credentials, schema migration state, backups, restore proof, retention/deletion policy and alerts. Do not test by pointing local or E2E commands at Production.
- Provision the initial administrator through a reviewed, secure operator process; do not use fictional demo accounts or the seed command in Production.
- Replace process-local rate limiting with shared enforcement, and test behind the actual trusted proxy.
- Verify embedded-preview cookie settings separately from ordinary same-site hosting; test CSP against the real map tile and deployment origins.
- Confirm OpenStreetMap tile usage/attribution suitability and any commercial SLA before production traffic.
- Review audit trigger/role ownership and database immutability requirements; add external archival/retention if necessary.
- Complete a security assessment, WCAG review, load/connection-budget test, user acceptance test with customer-approved data, and operator training. Agree how simulation labels and the illustrative CO₂ factor will be displayed.
- Set up deployment secrets, CI protection/approval policy, schema migration ordering, logs/metrics/error alerting, backup/restore, rollback and incident contact ownership.

## Release sequence

1. Build/test a commit against an isolated PostgreSQL environment (`npm ci`, `npm run db:generate`, `npm run db:deploy`, checks in `docs/TESTING.md`).
2. Have the authorized migration operator apply the reviewed additive migration to the intended database only after verifying a backup. Never run local test commands or seed data against Production.
3. Deploy a container with runtime-only secrets. During rolling upgrades, maintain backward-compatible schema until every older instance is drained.
4. Check generic `/api/health`, authentication and tenant boundaries, map attribution, reports and audit outcomes using a designated non-production tenant.
5. Promote only after acceptance and restore/recovery requirements pass; preserve previous image and compatible schema for rollback.

The deployment declaration is stored and the protected Production values are present, but no publish has been started. Production release remains held until database connectivity, reviewed migrations, initial administrator provisioning, approved production authentication, and the readiness/security checks above are verified and live publication is authorized.
