# WasteOps — Collection and Recycling Operations MVP

WasteOps is a software-only operational dashboard prototype for municipal waste collection teams. It provides organization-scoped staff access, collection-point management, scheduling and weight capture, a public request intake, operational reporting, OpenStreetMap views, and visibly simulated bin/vehicle records. It is a demo and workflow foundation; it is not an IoT, fleet-dispatch, environmental-measurement, or regulatory system.

## MVP boundary

The current build supports Admin, Supervisor and Collector roles; collection-point registration and deactivation; guarded collection scheduling/status changes and per-category kilograms; dashboard/recycling summaries and filters; a limited public request intake; an append-only audit stream; filtered CSV/PDF reports; Leaflet/OpenStreetMap maps; a human-reviewed straight-line route-order preview; and optional, off-by-default 3D views with text/2D alternatives.

All seeded sites, users, weights, readings and vehicle pings are fictional. Telemetry and demo vehicle coordinates are marked `SIMULATED`. No physical devices, live GPS, MQTT, RFID, dispatch, road-network route optimization, email/SMS, carbon measurement, compliance filing, native mobile app or offline operation is connected. Carbon-equivalent values are provisional calculations using the illustrative `2.5 kg CO₂e/kg` factor for plastic, paper, glass and metal only; this is not a measured or independently verified outcome. See [the MVP boundary](docs/MVP-BOUNDARY.md) and [future work](docs/FUTURE-WORK.md).

## Stack

- Next.js App Router 16.4, React 19, strict TypeScript and Tailwind CSS
- PostgreSQL 16+; Prisma ORM 7.10.1 with the `pg` driver adapter
- Auth.js Credentials sessions, Argon2id password hashing, Zod validation, server-side RBAC and tenant filtering
- Leaflet/OpenStreetMap, Recharts, React Three Fiber/Drei (lazy optional enhancement), `@react-pdf/renderer`
- Vitest, Playwright, axe-core, ESLint, Prettier, GitHub Actions and Dependabot

Exact package versions are in `package.json` and `package-lock.json`. The current Auth.js v5 package is a prerelease. This software MVP is not cleared for production authentication until that dependency is replaced with a supported stable release or an approved identity provider, the deployment checklist is completed, and a security review is signed off.

## Local setup (Windows PowerShell)

Requirements: Node.js 22.13 or later, npm 10.9.9, Git, and Docker Desktop with Docker Compose. In PowerShell, run:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace `AUTH_SECRET` with a new random secret and all three `INITIAL_*_PASSWORD` values with unique, non-shared passwords of at least 12 characters. You can generate a secret without a third-party service:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The values in `.env.example` are placeholders, not usable demo credentials. Do not use them as credentials on an internet-facing instance, do not copy a development `.env` to production, and never commit `.env`.

Start the local-only PostgreSQL service (its published port binds only to loopback):

```powershell
docker compose up -d postgres
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Sign in as `admin@example.test`, `supervisor@example.test`, or `collector@example.test`, using the password you set for that role in your own `.env`. All are fictional local demo users. The seed refuses to run until the administrator email and all three unique passwords are provided. Do not run the demo seed against shared or production data.

To stop only the local database container:

```powershell
docker compose down
```

Its local sample database persists in the `wasteops-postgres` named volume. To remove that volume, use `docker compose down -v` only if you intend to permanently delete that local fictional database.

## Useful commands

| Command                                   | Purpose                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                             | Start the development server on port 3000                                    |
| `npm run build`                           | Regenerate Prisma client and build Next.js production output                 |
| `npm run start`                           | Start the production build; honors `PORT`                                    |
| `npm run db:generate`                     | Regenerate the Prisma 7 client                                               |
| `npm run db:migrate`                      | Create/apply a development migration; review generated SQL before committing |
| `npm run db:deploy`                       | Apply committed migrations; do not use on an unverified live database        |
| `npm run db:seed`                         | Idempotently add/update the fictional local demo records and Argon2id users  |
| `npm run db:studio`                       | Open Prisma Studio; treat displayed resident-request data as sensitive       |
| `npm run format` / `npm run format:check` | Format / check authored files                                                |
| `npm run lint`                            | Run ESLint                                                                   |
| `npm run typecheck`                       | Run strict TypeScript checks                                                 |
| `npm test`                                | Run domain/unit tests                                                        |
| `npm run e2e`                             | Run serial Chromium browser and axe accessibility smoke tests                |
| `npm audit --audit-level=high`            | Check dependency advisories                                                  |

The browser suite needs a migrated and seeded disposable PostgreSQL database, the environment variables above, and Chromium. It starts the local app automatically unless a healthy local app already listens on port 3000.

## Key routes

Public: `/` (operations overview), `/login` (invitation-only staff sign-in), `/report` (resident request). Staff accounts are created by an organization administrator; public self-registration is disabled. Authenticated: `/dashboard`, `/collection-points`, `/collections`, `/recycling`, `/telemetry`, `/requests`, `/reports`, `/audit` (Admin only) and `/settings` (Admin only). APIs include `POST /api/requests`, authorized `GET /api/reports/export`, simulation controls and the non-sensitive `/api/health`. Page routes are listed in `public/manus-routes.json`; APIs are intentionally excluded from that page manifest.

## Environment

See `.env.example`. The app expects `POSTGRES_DATABASE_URL`, `AUTH_SECRET`, explicit `AUTH_COOKIE_SECURE`/`AUTH_COOKIE_SAME_SITE` settings and the initial seed account values. For local HTTP use secure `false` and same-site `lax`. For public HTTPS inside the cross-site Manus Preview frame, set secure `true` and same-site `none` in that preview environment; for a normal first-party HTTPS production site, use secure cookies and an appropriate first-party SameSite policy. Never infer these cookie settings from `NODE_ENV` or an internal proxy request. Third-party-cookie restrictions may still affect embedded Preview.

## Architecture and operations

See [architecture and data model](docs/ARCHITECTURE.md), [security and residual risks](docs/SECURITY.md), [deployment readiness](docs/DEPLOYMENT.md), [testing and CI](docs/TESTING.md), [operations runbook](docs/OPERATIONS.md), [API surface](docs/API.md), and [technical references](docs/TECHNICAL-REFERENCES.md).

This repo contains a standalone Docker recipe for a separately managed Node/PostgreSQL deployment. No production database, identity provider, domain, secret store, backup policy, or internet-facing instance is configured by this code delivery. The Manus-managed application database is MySQL-compatible; this code intentionally uses PostgreSQL and has not been connected to that managed database.
