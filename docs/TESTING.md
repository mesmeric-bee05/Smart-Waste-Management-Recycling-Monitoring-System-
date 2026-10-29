# Testing and verification

## Commands

| Command                                  | Scope                                                                                                                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                   | Prettier profile across authored source, schema, workflow, and documentation; generated Prisma output is excluded.                                                                                                                     |
| `npm run lint`                           | ESLint flat configuration, including Next Core Web Vitals and TypeScript rules.                                                                                                                                                        |
| `npm run typecheck`                      | Strict TypeScript for routes, services, forms, tests, and generated-client interfaces.                                                                                                                                                 |
| `npm test -- --reporter=dot`             | Vitest unit tests for collection lifecycle, safe CSV cells, material metrics, route-preview geometry, and strict calendar-date parsing.                                                                                                |
| `npm run e2e`                            | Six serial Chromium scenarios covering landing/sign-in/request/report/role behavior, with axe WCAG 2.1 A/AA scans of landing, sign-in, request, and dashboard pages.                                                                   |
| `npm run build`                          | Prisma client regeneration and optimized Next.js production build.                                                                                                                                                                     |
| `npm audit --audit-level=high`           | Full installed-tree vulnerability scan; rerun before releases.                                                                                                                                                                         |
| GitHub Actions full-history Gitleaks job | Downloads Gitleaks 8.30.1 with a fixed SHA-256, verifies a temporary root-commit fake-token canary, then streams every reachable root/merge diff into redacted `gitleaks stdin`; fails on empty Git history, scan errors, or findings. |
| GitHub Actions container smoke job       | Builds the standalone image, serves the public landing and route manifest, and asserts no `.env*` file is present in the runtime image.                                                                                                |

For local E2E, configure `.env.local` using `.env.example`, start a disposable local PostgreSQL instance, generate the client, apply committed migrations, and seed the fictional test accounts. The tests use only configured `example.test` identities and create a fictional public request on each run. Local E2E writes must target a loopback/dev database only. Never use the E2E environment or demo seed against shared, staging-customer, or production data.

CI provisions an ephemeral PostgreSQL 16 service for one workflow job; it does not connect to the WebDev-managed MySQL database or customer data. The isolated service uses trust authentication only inside the short-lived GitHub runner. CI generates fresh Auth.js and demo-account passwords for each run rather than storing them in YAML. The workflow does not require a deployment credential or Gitleaks license. The Linux x64 Gitleaks archive digest is pinned in `.github/workflows/ci.yml` and was verified against the official release metadata and checksums; local execution used the matching ARM64 release archive.

## Full-history secret scan

The workflow first creates a disposable one-commit root history with a randomly generated fake GitHub token and confirms Gitleaks reports the expected rule; the temporary repository, patch, and scanner log are removed at job exit and the token is never added to the project. It then checks for reachable Git commits and pipes `git log --all --full-history --root -m -p --no-ext-diff --no-color` into `gitleaks stdin --redact --no-color --verbose` with shell `pipefail`. This includes root commits and merge-resolution diffs while ensuring Git or scanner errors fail the job. This avoids the root-parent range failure documented in the [Gitleaks Action issue tracker](https://github.com/gitleaks/gitleaks-action/issues/199).

## Audit trigger verification

The migration adds a PostgreSQL trigger rejecting UPDATE and DELETE on `AuditLog`. This was verified against a local seeded audit row: a same-value UPDATE was rejected with SQLSTATE `55000` and message `AuditLog rows are append-only.`; no audit row was changed. Database owners can still disable triggers, so this is not a substitute for external immutable archival.

## Evidence snapshot — 2026-10-29

Final local verification after the public-page changes passed: strict TypeScript, ESLint with no warnings, Prettier check, all 14 Vitest tests in 4 files, all 6 Playwright tests, and `npm audit --audit-level=high` with 0 vulnerabilities. The optimized build completed with Next.js 16.4.3 and Prisma 7.10.1. The served Preview health check and `/`, `/login`, `/report` each returned HTTP 200; its JSON route manifest returned HTTP 200 and matched all 12 current App Router page routes.

The browser suite covered the public landing, its staff/resident routes and conspicuously `SIMULATED` example values; invitation-only sign-in and working password visibility control; fictional public-request submission and a safe reference; Admin sign-in, simulated-data disclosure, dashboard, private CSV export; and Collector denial of administrator settings. Automated axe scans found no WCAG 2.1 A/AA violations on the landing, sign-in, public request, or authenticated dashboard pages. Desktop and mobile screenshots were reviewed; the sign-in layout was corrected to a centered single-column flow. E2E database writes were guarded by confirming a loopback PostgreSQL target; only fictional test data was used.

The sandbox-local PostgreSQL 16 host was confirmed to be loopback before running `prisma migrate deploy`. All 3 committed migrations were present with no pending migrations. The idempotent fictional seed completed with 3 demo roles, 50 sample collection points, 250 collection records, 7 days of simulated readings, 2 simulated vehicles, and sample requests.

The official Gitleaks 8.30.1 release checksums were verified locally. The full-history stdin scan returned clean on the merged target/source repository history; a generated fake token in a disposable root commit was detected with the expected `github-pat` rule and nonzero status. [GitHub Actions run 40834631767](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-/actions/runs/40834631767) on destination commit `aaf6ef8cb8d4e5017da6d80afbc27b95254d2a1a` completed successfully with all three jobs: full-history secret scan, application checks, and runtime-container build/smoke. The first run exposed a missing quote in the container smoke check; it was corrected and the complete workflow passed on rerun.

An optional broad worktree scan reported 25 generic-key matches only in the ignored root `.env` and generated `.next` build artifacts, including Next preview keys and the standalone copy of local environment values. `git check-ignore` confirmed those paths are ignored, and `git ls-files` confirmed none is tracked; `.dockerignore` excludes `.env*` and `.next`. The Dockerfile removes `.env`/`.env.*` files from standalone output before runtime-image copy. The successful GitHub container job built the image, served `/` and `/manus-routes.json`, and confirmed the runtime image contains no `.env` files. The sandbox itself has no Docker CLI/daemon, so no local image build was performed. No customer database, production credentials, or live deployment were used.

## Test identifiers

UI automation deliberately uses accessible role, label, and text selectors rather than CSS classes or generated UUIDs. The principal smoke assertions are:

- the public landing's staff and resident CTAs use `/login` and `/report`, its sample values are marked `SIMULATED`, and both public routes are accessible;
- staff sign-in clearly states invitation-only provisioning and its password visibility control toggles accessibly;
- resident request intake accepts a fictional request without contact data and returns a short non-sensitive reference;
- the configured test Admin sees the operations dashboard and `SIMULATED` notice, exports an organization-scoped private/no-store CSV, and passes axe;
- the configured Collector cannot access Admin-only `/settings` and is returned to the unauthorized dashboard notice; and
- axe WCAG 2.1 A/AA scans run on the landing, sign-in, public request, and authenticated dashboard.
