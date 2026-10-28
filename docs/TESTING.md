# Testing and verification

## Commands

| Command                        | Scope                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`         | Prettier profile across authored source, schema, workflow, and documentation; generated Prisma output is excluded.                                                   |
| `npm run lint`                 | ESLint flat configuration, including Next Core Web Vitals and TypeScript rules.                                                                                      |
| `npm run typecheck`            | Strict TypeScript for routes, services, forms, tests, and generated-client interfaces.                                                                               |
| `npm test -- --reporter=dot`   | Vitest unit tests for collection lifecycle, safe CSV cells, material metrics, route-preview geometry, and strict calendar-date parsing.                              |
| `npm run e2e`                  | Six serial Chromium scenarios covering landing/sign-in/request/report/role behavior, with axe WCAG 2.1 A/AA scans of landing, sign-in, request, and dashboard pages. |
| `npm run build`                | Prisma client regeneration and optimized Next.js production build.                                                                                                   |
| `npm audit --audit-level=high` | Full installed-tree vulnerability scan; rerun before releases.                                                                                                       |
| GitHub Actions Gitleaks job    | Full-history secret scan on pushes and pull requests. The job disables comments and finding-artifact uploads.                                                        |

For local E2E, configure `.env.local` using `.env.example`, start a disposable local PostgreSQL instance, generate the client, apply committed migrations, and seed the fictional test accounts. The tests use only configured `example.test` identities and create a fictional public request on each run. Local E2E writes must target a loopback/dev database only. Never use the E2E environment or demo seed against shared, staging-customer, or production data.

CI provisions an ephemeral PostgreSQL 16 service for one workflow job; it does not connect to the WebDev-managed MySQL database or customer data. The isolated service uses trust authentication only inside the short-lived GitHub runner. CI generates fresh Auth.js and demo-account passwords for each run rather than storing them in YAML. The workflow does not require a deployment credential. For a repository owned by a GitHub organization, set the free Gitleaks license in the encrypted `GITLEAKS_LICENSE` repository or organization secret; personal-account repositories do not require it.

## Audit trigger verification

The migration adds a PostgreSQL trigger rejecting UPDATE and DELETE on `AuditLog`. This was verified against a local seeded audit row: a same-value UPDATE was rejected with SQLSTATE `55000` and message `AuditLog rows are append-only.`; no audit row was changed. Database owners can still disable triggers, so this is not a substitute for external immutable archival.

## Evidence snapshot — 2026-10-29

Final local verification after the public-page changes passed: strict TypeScript, ESLint with no warnings, Prettier check, all 14 Vitest tests in 4 files, all 6 Playwright tests, and `npm audit --audit-level=high` with 0 vulnerabilities. The optimized build completed with Next.js 16.4.3 and Prisma 7.10.1. The served Preview health check and `/`, `/login`, `/report` each returned HTTP 200; its JSON route manifest returned HTTP 200 and matched all 12 current App Router page routes.

The browser suite covered the public landing, its staff/resident routes and conspicuously `SIMULATED` example values; invitation-only sign-in and working password visibility control; fictional public-request submission and a safe reference; Admin sign-in, simulated-data disclosure, dashboard, private CSV export; and Collector denial of administrator settings. Automated axe scans found no WCAG 2.1 A/AA violations on the landing, sign-in, public request, or authenticated dashboard pages. Desktop and mobile screenshots were reviewed; the sign-in layout was corrected to a centered single-column flow. E2E database writes were guarded by confirming a loopback PostgreSQL target; only fictional test data was used.

The sandbox-local PostgreSQL 16 host was confirmed to be loopback before running `prisma migrate deploy`. All 3 committed migrations were present with no pending migrations. The idempotent fictional seed completed with 3 demo roles, 50 sample collection points, 250 collection records, 7 days of simulated readings, 2 simulated vehicles, and sample requests.

The Gitleaks GitHub Action is configured with commit-pinned dependencies but is awaiting the explicitly authorized source push to the target repository; inspect its run before claiming CI secret-scan success. No local Gitleaks executable was available. The Dockerfile was authored but no image build was attempted because this sandbox has no Docker CLI/daemon. No customer database, production credentials, or live deployment were used.

## Test identifiers

UI automation deliberately uses accessible role, label, and text selectors rather than CSS classes or generated UUIDs. The principal smoke assertions are:

- the public landing's staff and resident CTAs use `/login` and `/report`, its sample values are marked `SIMULATED`, and both public routes are accessible;
- staff sign-in clearly states invitation-only provisioning and its password visibility control toggles accessibly;
- resident request intake accepts a fictional request without contact data and returns a short non-sensitive reference;
- the configured test Admin sees the operations dashboard and `SIMULATED` notice, exports an organization-scoped private/no-store CSV, and passes axe;
- the configured Collector cannot access Admin-only `/settings` and is returned to the unauthorized dashboard notice; and
- axe WCAG 2.1 A/AA scans run on the landing, sign-in, public request, and authenticated dashboard.
