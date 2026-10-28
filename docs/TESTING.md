# Testing and verification

## Commands

| Command                        | Scope                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run format:check`         | Prettier profile across authored source, schema, workflow and documentation; generated Prisma output is excluded.                                            |
| `npm run lint`                 | ESLint flat configuration, including Next Core Web Vitals and TypeScript rules.                                                                              |
| `npm run typecheck`            | Strict TypeScript for routes, services, forms, tests and generated-client interfaces.                                                                        |
| `npm test -- --reporter=dot`   | Vitest unit tests for collection lifecycle, safe CSV cells, material metrics, route-preview geometry, and strict calendar-date parsing.                      |
| `npm run e2e`                  | Serial Chromium coverage for public requests, authentication/role denial, private CSV export, and axe WCAG 2.1 A/AA scans of the public and dashboard pages. |
| `npm run build`                | Prisma client regeneration and optimized Next.js production build.                                                                                           |
| `npm audit --audit-level=high` | Full installed-tree vulnerability scan; rerun before releases.                                                                                               |
| GitHub Actions Gitleaks job    | Full-history secret scan on pushes and pull requests. The job disables comments and finding-artifact uploads.                                                |

For local E2E, configure `.env.local` using `.env.example`, start a disposable local PostgreSQL instance, generate the client, apply committed migrations, and seed the fictional test accounts. The tests use only configured `example.test` identities and create a fictional public request on each run. Local E2E writes must target a loopback/dev database only. Never use the E2E environment or demo seed against shared, staging-customer, or production data.

CI provisions an ephemeral PostgreSQL 16 service for one workflow job; it does not connect to the WebDev-managed MySQL database or customer data. The isolated service uses trust authentication only inside the short-lived GitHub runner. CI generates fresh Auth.js and demo-account passwords for each run rather than storing them in YAML. The workflow does not require a deployment credential. For a repository owned by a GitHub organization, set the free Gitleaks license in the encrypted `GITLEAKS_LICENSE` repository or organization secret; personal-account repositories do not require it.

## Audit trigger verification

The migration adds a PostgreSQL trigger rejecting UPDATE and DELETE on `AuditLog`. This was verified against a local seeded audit row: a same-value UPDATE was rejected with SQLSTATE `55000` and message `AuditLog rows are append-only.`; no audit row was changed. Database owners can still disable triggers, so this is not a substitute for external immutable archival.

## Evidence snapshot — 2026-10-29

The strict TypeScript check, ESLint with no warnings, Prettier check, 14 Vitest tests in 4 files, and all 4 Playwright tests passed. Unit coverage includes rejecting impossible calendar dates rather than allowing JavaScript to normalize them. The browser suite covered public request intake, Admin sign-in and dashboard, simulated-data disclosure, a private CSV download, Collector denial of administrator settings, and axe scans of the public and dashboard pages. The final optimized Next.js 16.4.3 build completed successfully with Prisma 7.10.1.

The sandbox-local PostgreSQL 16 host was confirmed to be loopback before running `prisma migrate deploy`. All 3 committed migrations were present with no pending migrations. The idempotent fictional seed completed with 3 demo roles, 50 sample collection points, 250 collection records, 7 days of simulated readings, 2 simulated vehicles, and sample requests. `npm audit --audit-level=high` reported 0 known vulnerabilities in the checked dependency tree.

The Gitleaks GitHub Action is configured with commit-pinned dependencies, but it has not run on GitHub because the requested destination is an existing repository that the bound WebDev project cannot adopt. There was no local Gitleaks executable to run separately. The Dockerfile was authored but no image build was attempted because this sandbox has no Docker CLI/daemon. No customer database, production credentials, or live deployment were used.

## Test identifiers

UI automation deliberately uses accessible role, label and text selectors rather than CSS classes or generated UUIDs. The principal smoke assertions are:

- sign in as the configured test Admin and see the operations dashboard and visible `SIMULATED` notice;
- submit a public collection request without contact information and receive a short non-sensitive reference;
- sign in as the configured Collector and confirm `/settings` redirects to the unauthorized dashboard notice;
- download an organization-scoped report as Admin and verify private/no-store CSV behavior; and
- run axe on the public request screen and authenticated dashboard.
