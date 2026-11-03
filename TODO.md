# Delivery Outcomes

## 1. Responsive, accessible application shell and navigation — implemented; desktop/mobile visual review complete; customer/device UAT open

Acceptance: provides a coherent operations experience for administrator, supervisor, and collector roles; works across desktop/tablet/mobile; includes clear loading, empty and error states, keyboard operation, visible focus, readable contrast, reduced-motion behavior, and non-color status cues.

## 2. Secure identity, role permissions, and audit trail — implemented; production security review open

Acceptance: role-appropriate UI is supported for Admin, Supervisor, and Collector. Protected server actions and route handlers validate input and enforce authorization before business logic. Collectors may update only their assigned collections. Mutations, status changes, report exports, authentication events, and sensitive administration actions create append-only audit records; secrets and unnecessary personal data are excluded.

## 3. Collection point registry and geolocation — implemented; full workflow/customer UAT open

Acceptance: authorized users can create, view, update, and deactivate collection points; validate unique human-readable codes and latitude/longitude bounds; store configured zone/category/capacity and active state; and view points on an accessible Leaflet/OpenStreetMap map and equivalent list.

## 4. Collection schedule, assignment, and completion workflow — implemented; end-to-end customer UAT open

Acceptance: authorized users can schedule and assign a collection; the status lifecycle is guarded (Scheduled → In Progress → Completed, with permitted exception handling); collectors may update only their own assignments; completion records non-negative per-category kilograms, UTC timestamps, optional notes, and audit history.

## 5. Recycling aggregation and trustworthy dashboard — implemented; filter/metric UAT open

Acceptance: recycling and operational KPIs are computed server-side from completed records; date/zone/category filters work; KPI formulas, units, update scope, and data quality are documented; derived CO₂ figures, if displayed, are labelled estimates with the explicitly documented factor and not claimed as measured impact. Dashboard charts have accessible text/table equivalents.

## 6. Public collection requests and notification workflow — implemented; staff-lifecycle UAT open

Acceptance: public request submission is validated, rate-limited where infrastructure permits, and does not expose internal records; requests support OPEN → ACKNOWLEDGED → RESOLVED/REJECTED with authorized handling, linked point/area, minimal personal data, and audit events. External email/SMS is deferred unless actually configured.

## 7. Simulated telemetry and vehicle-map demonstration — implemented; operator UAT open

Acceptance: seeded/deterministic simulated bin fills and vehicle pings are marked `SIMULATED` in all UI/report surfaces; simulation controls are authorized; location/route data never implies a live hardware connection; invalid or stale demo readings are distinguishable; no MQTT, RFID, physical sensor, or real GPS integration is claimed.

## 8. Map route preview and optional 3D enhancements — one-shot motion implemented and reviewed; reduced-motion and axe scenario passed; production/operator UAT open

Acceptance: map and simple route preview function with accessible list/text alternatives; any route is a non-dispatched preview and must be reviewed by a human. Optional 3D bin fill/route scene loads dynamically, can be disabled, respects reduced motion, and has equivalent 2D information. 3D must not block core workflows. The decorative WebGL canvas is hidden from assistive technology because sample fill, route order, labels, and warnings remain available as equivalent text.

Requested refinement: use restrained 3D motion only after the operator explicitly enables a scene; stop motion when settled; keep demand-rendered WebGL inactive when disabled or hidden; skip automatic animation and rotation when `prefers-reduced-motion` is active. Preserve `SIMULATED` and “no dispatch” provenance. The final optimized build and all 8 browser scenarios passed after this change.

## 9. CSV/PDF reports — implemented; PDF/filter acceptance review open

Acceptance: authorized users can generate period reports with filters, totals, per-zone and per-category summaries, generation timestamp, and actor; CSV formula prefixes are safely escaped; export permissions are checked server-side and exports are audited; no unauthorized personal data is included.

## 10. Documentation, automated checks, release, and repository delivery — audit refinements prepared; Production release authorized, result not yet verified

Acceptance: README covers setup, environment variables, scripts, fictional demo access (only if seeded securely), and run instructions; docs describe architecture, data model, threat model, test identifiers, simulation boundaries, deployment, operations, and future work. CI runs formatting/lint/type checks/tests/build plus available dependency/secret scans. Report actual check outcomes accurately. Commit and push the completed project to the user-specified GitHub repository without secrets or production data. Preserve the existing destination `main` history and `LICENSE`; do not force-push or change the bound WebDev canonical repository.

## 11. Public landing and secure sign-in redesign — responsive preview reviewed; browser and axe checks passed

Acceptance: replace the root dashboard redirect with a clear, responsive public landing page that explains the software-only operations scope; staff-sign-in CTAs lead to `/login`, and the public collection-request CTA leads to `/report`. Redesign the sign-in surface for desktop, tablet, and mobile; keep the existing real credential flow, generic authentication errors, pending feedback, and role-based authorization. Include an accessible password show/hide control. Account creation remains administrator-provisioned and invitation-only; do not add public self-registration or unauthenticated role selection. Every new link/button must perform its stated action, all simulated/illustrative values must be unmistakably labeled as not live, and optional 3D-style movement must flatten/stop for `prefers-reduced-motion` and must not block the core routes.

Requested preview: capture the updated landing and staff sign-in flow at desktop and narrow-mobile sizes; verify responsive controls and keep account access invitation-only. Final 1280 px desktop and 390 px mobile screenshots were captured after the secure Preview restart; eight E2E scenarios assert no horizontal overflow at 768 px and 390 px, exercise the opt-in telemetry visualization under reduced motion, and check deterministic hydration under a non-default locale/time zone.

Authentication Preview behavior: the embedded public HTTPS Preview uses explicit `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none`; no cookie policy is inferred from `NODE_ENV` or an internal proxy request. Hosted production defaults to `Secure; SameSite=Lax`; plain-HTTP localhost can opt out through the local example configuration.

## 12. Production runtime configuration and safe publish readiness — protected URLs replaced; current authorized release outcome pending

Acceptance: configure the root `Dockerfile` and unauthenticated `/api/health` readiness route. Configure `POSTGRES_DATABASE_URL` for user-provisioned external PostgreSQL and a new `AUTH_SECRET` of at least 32 random bytes in the protected Production input surface only. Never copy development/build credentials into Production or put secrets in chat, source, config files, Git, logs, or screenshots. The protected Production scope contains the runtime URL, Auth secret, migration-role URL, and the user-enabled initial gate; values are not exposed. Previous attempts for `fa209835d14a5bc95a72cf0770e89464bd755f4b` rejected malformed URL syntax before any database connection. On 2026-11-03, the user replaced both PostgreSQL URL values through protected input and explicitly authorized the current Production publication and exactly the three additive migrations despite the documented open gates. The new values' syntax, endpoint, credentials, TLS, and role grants are not independently verified until the release runs. The application's runtime role must have DML/sequence access only to application tables, no schema DDL, and no access to `public._prisma_migrations`; the distinct Production migration role is required only for guarded schema initialization, and the two URLs must target the same database/schema. Never substitute the platform's MySQL-compatible managed database.

## Remaining gates

The software remains bound to its Manus-managed repository; the named public GitHub repository is a separate destination, and the repository binding has not been switched. GitHub `main` preserves its prior history and `LICENSE`; at the time of this update its head is `80c676700e4af56718a9b4730d7d2c07a7f4e203`, which contains the source through `36dd5e1`. The current audit changes are being prepared for that target. Prior exact-SHA GitHub Actions run `41182161829` passed application checks, full-history Gitleaks scanning, and runtime container smoke; earlier migration-gate run `40860929510` and docs-only run `40861874402` also passed. On 2026-11-03, the user replaced both Production PostgreSQL URLs through protected input and reauthorized publication and exactly the three approved additive migrations. The new endpoint/credential/role configuration has not yet been tested against PostgreSQL, and this release's database, migration, seed, initial Admin, health, and live-deployment outcomes remain unverified.

Latest local verification on 2026-11-03: formatting, lint, strict TypeScript, 24/24 Vitest tests, 8/8 Playwright scenarios, optimized production build, and both full-tree and production-only npm audits passed. All 8 browser scenarios used loopback-only Development PostgreSQL; Preview health and public routes returned HTTP 200 before the final build. A read-only Development ledger query confirmed the three migration checksums match their approved SQL hashes. These results do not establish Production connectivity or role grants. A React Three Fiber stable-v9 `THREE.Clock` deprecation and an Auth.js expected CSRF rejection appeared in development logs; neither caused a failing test, and no application source calls the deprecated Clock API.

Residual Production risks remain: Auth.js is a prerelease; the rate limiter is process-local and trusted proxy handling needs validation; tenant isolation lacks database RLS/composite constraints; endpoint/TLS/role grants, backup/restore, initial-admin provisioning, independent security review, and customer UAT remain unverified. The user explicitly accepted these open gates for the current release attempt; this does not constitute a security certification or evidence that the risks are resolved. The product remains a software-only phase with no live IoT/GPS integration.

## 13. Gated initial Production PostgreSQL migration — isolated-CI path passed; renewed Production attempt authorized, outcome pending

Acceptance: default startup performs no migration. Only when Production-only `WASTEOPS_RUN_INITIAL_MIGRATIONS=true` is explicitly enabled may the container consider migration. It must require both the protected least-privilege runtime `POSTGRES_DATABASE_URL` and a distinct protected `POSTGRES_MIGRATION_DATABASE_URL` migration-role URL; in Production their database role names must differ, while host, port, database, and schema must match exactly. The migration URL must be removed from the Next.js server process environment before the app starts. The runner verifies that the migrations directory contains exactly the three user-approved migration IDs (`20261028200524_init`, `20261028232800_collection_point_location_source`, and `20261028234000_audit_log_append_only`), checks the pinned SQL SHA-256 values and PostgreSQL migration lock, and refuses to migrate a target schema containing unrelated database objects when no approved migration history exists. It runs only `prisma migrate deploy`, mapping the migration URL to `POSTGRES_DATABASE_URL` only inside the migration CLI subprocess; it must never call the fictional seed, create demo accounts/data, or execute unapproved SQL. It must verify all three successful rows in Prisma's `_prisma_migrations` ledger before starting the web server, never log either URL/credentials, and fail closed on missing/mismatched URLs, same Production role, errors, incomplete/duplicate/rolled-back/unapproved history, unexpected migration set, or altered SQL. After the approved baseline is recorded, later starts must skip further migrations even if the gate remains set; changed migration files fail closed. Remove the Production-only gate and migration-role secret after the first successful migration. Validate only against a disposable CI PostgreSQL service; local `--verify` and `migrate deploy` were not run because no migration-role URL is configured locally. Previous Production startup attempts with the older protected values failed before connecting and made no database changes. On 2026-11-03, both URLs were replaced through protected input and the user explicitly authorized a new publish with exactly these three additive migrations despite the open gates. The new Production connection and migration outcome are not yet verified; do not report migration, seed, Admin provisioning, health, or publication success until evidence confirms it.

## 10. Documentation, automated checks, release, and repository delivery — baseline delivered to GitHub; local audit delta pending external sync; live release held

Checksum rule refinement: every successful applied migration ledger checksum must match the approved SQL SHA-256 before a completed baseline may be accepted; mismatches fail closed, including on a startup that would otherwise skip migration.

## Current release update — 2026-11-03

The preceding held-release snapshots predate today's protected-input replacements and renewed authorization. The user replaced both Production PostgreSQL URLs through secure input and authorized one Production publication with exactly the three approved additive migrations despite the documented open gates. The new values and database connection have not yet been verified; no Production migration, seed, initial administrator, health check, or successful deployment is claimed at this update. The GitHub destination is accessible through the enabled connector and remains separate from the bound Manus repository; current security-audit changes are being synced without changing the repository binding. Local format, lint, strict TypeScript, 24 unit tests, 8 E2E scenarios, optimized build, and full/production dependency audits passed; test writes used loopback-only Development PostgreSQL.
