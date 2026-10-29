# Implementation Plan — WasteOps

## Verified starting point

The customer blueprint is the product source of truth. The completed software MVP is in `/home/ubuntu/wasteops`, bound to its existing Manus-managed Git repository. The exact customer GitHub destination is a separate, existing public repository on `main`; read-only inspection on 2026-10-29 verified that it contained only `LICENSE` at commit `a7550ea` (`Initial commit`) and that its license matched the source project license. The current user explicitly instructed a direct project-code push to that destination. Preserve its existing `main` history and license; do not force-push or change the WebDev canonical binding.

## Product and MVP boundary

Deliver a responsive operations platform for administrators, supervisors, and collectors. MVP workflows: role-appropriate access; collection-point registry and geolocation; scheduling, assignment, status transitions and per-category weights; recycling aggregation; dashboard/KPI views; public collection requests; audit history; CSV/PDF reports; a map and simple route preview; deterministic simulated bin readings and vehicle positions, each prominently identified as `SIMULATED`; and carefully time-boxed 3D bin/route previews with full accessible 2D alternatives.

The requested public experience includes a purposeful `/` entry page, a redesigned `/login` surface, working staff-sign-in and resident-request paths, and mobile/tablet/desktop layouts. Staff provisioning stays administrator-controlled and invitation-only: do not add public self-sign-up or unauthenticated role selection. The public landing hero may use fictional example values only if unmistakably identified as illustrative/simulated and not live. Subtle CSS perspective/floating motion is an optional visual layer; respect `prefers-reduced-motion`, keep every CTA keyboard-operable, and do not make 3D a prerequisite for a workflow.

Physical sensors, RFID provisioning, live GPS/fleet tracking, MQTT/device certificates, industrial facilities/SCADA/PLC, real route dispatch/production VRP, predictive ML, complete native mobile/offline app, automated regulatory submissions, and measured carbon claims are future work. No feature may suggest these integrations are live. Use a single demo organization unless multi-tenant requirements are confirmed; do not claim production isolation for unconfigured tenancy.

## Architecture and stack

Use a TypeScript strict-mode Next.js App Router modular monolith and its server actions/route handlers, service/domain/repository boundaries, PostgreSQL with Prisma ORM 7.10.1 and the `pg` driver adapter, Auth.js Credentials authentication, Zod validation, and server-enforced role/resource authorization. Use Leaflet/OpenStreetMap for the map, Recharts for operational charts, React Three Fiber/Drei loaded dynamically for optional operational 3D, and CSV/PDF export adapters. Lock all dependencies, verify current security advisories, and document that Auth.js v5 remains a prerelease and must be resolved before a production authentication deployment. Avoid extra services/microservices until a proven operational need exists.

Mutations must flow through validated server-side services, enforce role and record ownership, and emit append-only audit events (enforced against UPDATE/DELETE by a PostgreSQL trigger). Keep simulated telemetry in explicit source/provenance fields. Use seeded non-personal demo records. No secret or production data enters the repository. Do not add undocumented cloud credentials, paid map services, external notification delivery, or operational claims. Clearly document any environment dependency and fallback.

## Project structure

- `app/`: App Router pages/layouts and server route handlers, including public landing, sign-in, public-request and protected operations routes.
- `src/components/`: accessible shared UI, the reusable illustrative operations preview card, charts/maps, and lazily loaded optional 3D scenes.
- `src/domain/`: roles, invariants, status transitions, metrics, units, and schemas.
- `src/server/`: auth, authorization, services, repositories, audit, export, simulation, and providers.
- `prisma/`: canonical MVP schema, migrations, and fictional seed data.
- `public/`: icons and static route manifest.
- `docs/`: current-state, MVP scope, architecture, data model, API, threat model, test-ID contract, simulation, deployment, repository delivery, operations, future work.
- `.github/workflows/`: automated checks and dependency update configuration.

## Design direction

Apply the product-specific overrides at `design-system/circular-operations/pages/` and retain relevant accessibility guidance from UI/UX Pro Max. The generated master is kept for traceability but was categorized as an LMS and prescribed unrelated academic Cormorant/Crimson typography; it must not be used as this product's visual direction. Use a refined civic-operations console: quiet light/dark surfaces, emerald/teal as the operational signature, amber/crimson reserved for semantic warnings/critical states, dense but breathable tabular layouts, Inter-like UI typography with a monospaced metric/data face, restrained shadows, crisp hierarchy, SVG icons, and short purposeful transitions. The public landing is a calm civic product entry—not a generic marketing template—with concise action-led copy, a clearly marked illustrative operations card, invitation-only account guidance, and a distinct public-request path. The staff sign-in screen is a focused, centered single-column form at every breakpoint, with no sample KPIs or marketing panel, consistent with the public-page design override. Use only clearly labelled example values. Use 3D as optional progressive enhancement; respect reduced motion, lazy-load, pause hidden rendering, and preserve 2D/table/text equivalents. Avoid decorative 3D that obscures work or affects performance.

### Applied design system

- **Design movement:** polished civic operations interface with restrained flat surfaces, precise typographic hierarchy, and purposeful visualization; follow the product-specific UI/UX Pro Max-derived overrides and blueprint typography, not the unrelated generated LMS treatment.
- **Core principles:** operational clarity; honest provenance; accessible by default; fast and predictable interactions.
- **Color philosophy:** deep teal/emerald for platform identity and healthy states; amber for caution; crimson for critical issues; cool neutral surfaces for long working sessions. Never communicate a state only through color.
- **Layout paradigm:** persistent operations navigation beside a flexible content canvas for staff; a spacious asymmetric public landing that pairs concise product copy with a clearly marked illustrative operations card; a quiet single-column public sign-in task.
- **Signature elements:** compact circular-material mark; visible `SIMULATED` source badges; crisp status rails and measured KPI typography.
- **Interaction philosophy:** actions show immediate, reversible feedback where safe; destructive/irreversible transitions are explicit; no auto-dispatch, surprise telemetry, or hover-only operations. Public links go to real existing routes; staff account access stays invitation-only.
- **Animation:** retain restrained CSS perspective movement on the public landing illustration; keep staff sign-in static. Optional operational 3D stays off until explicitly enabled and near the viewport, then uses one short, low-amplitude bin reveal or route-trace pass and returns to an idle frame. `prefers-reduced-motion` skips these animations and disables rotation; demand rendering avoids continuous background GPU use. The canvas is decorative to assistive technology; retain equivalent sample fill, route list, labels, and status text. Preserve all 2D/list/text equivalents.
- **Typography:** Inter-style UI text and JetBrains-Mono-style numeric/data readouts; clear scale, tabular numerals for metrics, and legible 16 px body text.
- **Brand essence:** a clear operational workspace for municipal waste teams that turns collection records into trustworthy diversion insight; precise, calm, accountable.
- **Brand voice:** concise, action-led, factual. Examples: “Make every collection count.” “Example values only; no live devices are connected.”
- **Wordmark/mark:** custom circular material-flow mark paired with the WasteOps wordmark; no emoji icons.
- **Signature brand color:** dark teal/emerald, balanced against neutral operations surfaces.

## Implementation sequence

1. Preserve the implemented software-MVP workflows and deterministic fictional demo seed.
2. Maintain domain schemas, authentication/access helpers, audit service, and collection-point workflows.
3. Maintain scheduling and guarded collection lifecycle with weight capture and server-side aggregate metrics.
4. Maintain public requests, dashboard/reporting, CSV/PDF, and geospatial map/route preview.
5. Maintain simulated readings/vehicle pings and optional 3D after the accessible 2D workflows.
6. Implement the refreshed public landing and sign-in experience; verify intended links, invitation-only copy, password visibility control, responsive layout, accessibility, reduced-motion behavior, and route manifest.
7. Review 3D motion: make scene entry opt-in, keep GPU work demand-driven and visible-only, add only a short, calm reveal/path trace, and skip all automatic movement for reduced-motion users.
8. Run static checks, unit/E2E/accessibility/security review and an optimized build, resolve evidenced defects, then document actual outcomes.
9. Commit and checkpoint verified changes only when checkpoint-triggered publication is safe. Separately merge source history into the user-authorized GitHub `main` without force-pushing, preserving its existing history and license; document the resulting SHA and available CI result.

## Hosting and data assumptions

Local development uses PostgreSQL 16 and fictional seeded records. The project's managed database is MySQL-compatible and is not used by this PostgreSQL application; a real external PostgreSQL connection is required for hosted persistence. Do not fabricate deployment credentials or show a connected production state. Never run destructive migrations or use real personal data. Public repository contents must contain no secrets or customer/production data.

### Repository and hosting constraints

The source WebDev project remains bound to the Manus-managed repository. The requested GitHub repository is the separate public target at `https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-`; the user explicitly authorized delivery there. This is a direct code push, not a canonical-repository switch. Preserve destination `main` and its existing `LICENSE`/history, fetch and integrate the latest target tip before pushing, and never force-push, overwrite unrelated remote work, substitute a new repository, expose credentials, or include ignored environment files. The target is publicly visible; the user selected it. PostgreSQL remains the approved application database; the platform-managed database is MySQL-compatible and must not be silently substituted. A real PostgreSQL service, stable approved identity provider, protected secrets, production review, and customer UAT are still prerequisites for production deployment.

## Public-route layout clarification

The public `/` landing uses the asymmetric two-column civic-operations layout on desktop and collapses to one column on narrow screens. Its only sample data visualization is the explicitly illustrative `SIMULATED` operations card. The `/login` staff entry remains a focused, centered single-column form at every breakpoint; it does not display sample KPIs or decorative WebGL. Both routes share typography, colors, brand mark, and concise factual language. Motion is a small CSS-perspective progressive enhancement on the landing card only; reduced-motion settings flatten/stop it. Optional dashboard 3D remains separate from public sign-in and never gates an operational workflow.

## Current deployment configuration status

The bound WebDev project stores the root `Dockerfile` and unauthenticated PostgreSQL-backed `/api/health` deployment declaration. The protected Production scope currently contains `POSTGRES_DATABASE_URL` and `AUTH_SECRET`; their values are not exposed or copied into development. The user confirmed that the existing protected PostgreSQL URL is the dedicated/new WasteOps target and authorized only the three currently committed additive migrations. No production connection test, migration, seed, admin creation, or publish has occurred. The container gate is being prepared with `WASTEOPS_RUN_INITIAL_MIGRATIONS=true`, the protected runtime URL, and a distinct Production-only `POSTGRES_MIGRATION_DATABASE_URL` migration-role URL targeting the same database. The new migration URL is not currently configured or requested. The gate verifies the exact three migration IDs and SQL hashes, runs only `prisma migrate deploy` without seeding, verifies the ledger, and fails closed on unexpected history or files. The entrypoint removes the migration URL and gate flag before starting Next.js. After the first approved migration, remove the gate and migration-role secret. Production connectivity/TLS, administrator provisioning, and authentication policy remain unverified. `publishing.auto_publish` is enabled; do not push a bound-main checkpoint or publish without separate approval of the exact release. Never reuse development/build credentials or substitute the managed MySQL-compatible database.

## Gated first-run PostgreSQL migration

The user confirmed the existing protected Production `POSTGRES_DATABASE_URL` is the intended dedicated/new WasteOps target and authorized only the three currently committed additive migrations. Treat that URL as the application's least-privilege runtime connection. A separate `POSTGRES_MIGRATION_DATABASE_URL` will be required for the one-time DDL/migration role; it must target the same host, port, database, and schema, use a different database role in Production, and be stored only in the protected Production scope. It is not configured; do not request or use it until the user is ready for the separately approved release. Neither URL may be copied into local `.env`, CI secrets, source, logs, or chat.

The container startup gate defaults to off. Only `WASTEOPS_RUN_INITIAL_MIGRATIONS=true` enables it; an enabled gate fails closed if either DSN is absent, targets differ, the Production usernames are the same, the approved migration bundle/hash/provider differs, database history is unexpected/incomplete, or Prisma migration fails. It verifies exactly the three user-approved migration IDs and SQL hashes, maps the migration URL to `POSTGRES_DATABASE_URL` only inside the Prisma CLI subprocess, runs `prisma migrate deploy` and no seed/custom data SQL, then verifies all three successful `_prisma_migrations` rows before starting the application. Once the exact baseline is recorded, subsequent gated starts skip migrations; future/changed migration sets fail closed. The entrypoint unsets the migration DSN and gate flag before `exec` of Next.js. After the approved first migration, remove the Production-only gate and migration-role secret; keep the restricted runtime DSN for the application. Validation uses only disposable CI PostgreSQL with separate roles and local Development ledger verification. No Production connection, migration, seed, admin creation, or publication has occurred. The user requires a separate, exact-checkpoint approval before publishing; `publishing.auto_publish` remains enabled, so no bound-main checkpoint will be pushed without that approval.
