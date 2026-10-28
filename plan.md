# Implementation Plan — WasteOps

## Verified starting point

The requested GitHub repository contains only `LICENSE` on `main`; no app framework, source code, database schema, authentication, tests, CI, or deployment files exist. Therefore there is no baseline product behavior or test suite to preserve and no truthful baseline build/test results. The complete customer blueprint and its technical feasibility review are the product source of truth. This plan freezes the software-only MVP while retaining future integration boundaries.

## Product and MVP boundary

Deliver a responsive operations platform for administrators, supervisors, and collectors. MVP workflows: role-appropriate access; collection-point registry and geolocation; scheduling, assignment, status transitions and per-category weights; recycling aggregation; dashboard/KPI views; public collection requests; audit history; CSV/PDF reports; a map and simple route preview; deterministic simulated bin readings and vehicle positions, each prominently identified as `SIMULATED`; and carefully time-boxed 3D bin/route previews with full accessible 2D alternatives.

Physical sensors, RFID provisioning, live GPS/fleet tracking, MQTT/device certificates, industrial facilities/SCADA/PLC, real route dispatch/production VRP, predictive ML, complete native mobile/offline app, automated regulatory submissions, and measured carbon claims are future work. No feature may suggest these integrations are live. Use a single demo organization unless multi-tenant requirements are confirmed; do not claim production isolation for unconfigured tenancy.

## Architecture and stack

Use a TypeScript strict-mode Next.js App Router modular monolith and its server actions/route handlers, service/domain/repository boundaries, PostgreSQL with Prisma ORM 7.10.1 and the `pg` driver adapter, Auth.js Credentials authentication, Zod validation, and server-enforced role/resource authorization. Use Leaflet/OpenStreetMap for the map, Recharts for operational charts, React Three Fiber/Drei loaded dynamically for optional 3D, and CSV/PDF export adapters. Lock all dependencies, verify current security advisories, and document that Auth.js v5 remains a prerelease and must be resolved before a production authentication deployment. Avoid extra services/microservices until a proven operational need exists.

Mutations must flow through validated server-side services, enforce role and record ownership, and emit append-only audit events (enforced against UPDATE/DELETE by a PostgreSQL trigger). Keep simulated telemetry in explicit source/provenance fields. Use seeded non-personal demo records. No secret or production data enters the repository. Do not add undocumented cloud credentials, paid map services, external notification delivery, or operational claims. Clearly document any environment dependency and fallback.

## Project structure

- `app/`: App Router pages/layouts and server route handlers.
- `components/`: accessible shared UI, operational charts/maps, and lazily loaded optional 3D scenes.
- `src/domain/`: roles, invariants, status transitions, metrics, units, and schemas.
- `src/server/`: auth, authorization, services, repositories, audit, export, simulation, and providers.
- `prisma/`: canonical MVP schema, migrations, and fictional seed data.
- `public/`: icons and static route manifest.
- `docs/`: current-state, MVP scope, architecture, data model, API, threat model, test-ID contract, simulation, deployment, operations, future work.
- `.github/workflows/`: automated checks and dependency update configuration.

## Design direction

Apply the product-specific overrides at `design-system/circular-operations/pages/` and retain the relevant accessibility guidance from UI/UX Pro Max. The generated master is kept for traceability but was categorized as an LMS and prescribed unrelated academic Cormorant/Crimson typography; it must not be used as this product's visual direction. Use a refined civic-operations console: quiet light/dark surfaces, emerald/teal as the operational signature, amber/crimson reserved for semantic warnings/critical states, dense but breathable tabular layouts, Inter-like UI typography with a monospaced metric/data face, restrained shadows, crisp hierarchy, SVG icons, and short purposeful transitions. Use 3D as optional progressive enhancement only; respect reduced motion, lazy-load, pause hidden rendering, and preserve 2D/table/text equivalents. Avoid decorative 3D that obscures work or affects performance.

## Implementation sequence

1. Build the shell and deterministic demo seed.
2. Implement domain schemas, authentication/access helpers, audit service, and collection-point workflows.
3. Implement scheduling and guarded collection lifecycle with weight capture and server-side aggregate metrics.
4. Add public requests, dashboard/reporting, CSV/PDF, and geospatial map/route preview.
5. Add simulated readings/vehicle pings and optional 3D only after the 2D workflows work.
6. Run static checks, tests, build, accessibility/security review, resolve defects, then document verified commands and results.

## Hosting and data assumptions

The initialized WebDev project is bound to a Manus-managed Git repository. The customer-specified GitHub repository is an existing, separate repository that currently contains only a license; the supported canonical-transfer flow cannot adopt an existing repository. Do not change remotes, bypass the supported transfer flow, overwrite history, or claim a GitHub push. Request user direction before any repository-transfer alternative. Local development uses PostgreSQL 16 and fictional seeded records. The project's managed database is MySQL-compatible and is not used by this PostgreSQL application; a real external PostgreSQL connection is required for hosted persistence. Do not fabricate deployment credentials or show a connected production state. Never run destructive migrations or use real personal data.

### Applied design system

- **Design movement:** polished civic operations console with restrained flat surfaces, precise typographic hierarchy, and purposeful visualization; use the authored product-specific UI/UX Pro Max-derived override and blueprint typography, not the unrelated generated LMS treatment.
- **Core principles:** operational clarity; honest provenance; accessible by default; fast and predictable interactions.
- **Color philosophy:** deep teal/emerald for the platform identity and completed/healthy states; amber for caution; crimson for critical issues; cool neutral surfaces for long working sessions. Never communicate a state only through color.
- **Layout paradigm:** persistent operations navigation beside a flexible content canvas; tables and task boards for high-density workflows; map and visualization as switchable supporting views rather than the only interface.
- **Signature elements:** a compact circular-material mark; visible SIMULATED source badges; crisp status rails and measured KPI typography.
- **Interaction philosophy:** actions show immediate, reversible feedback where safe; destructive/irreversible transitions are explicit; no auto-dispatch, surprise telemetry, or hover-only operations.
- **Animation:** restrained 150–220 ms transitions; motion clarifies state only; respect `prefers-reduced-motion`; lazy-load and suspend optional 3D off-screen.
- **Typography:** Inter-style UI text and JetBrains-Mono-style numeric/data readouts; clear scale, tabular numerals for metrics, and legible 16 px body text.
- **Brand essence:** a clear operational workspace for municipal waste teams that turns collection records into trustworthy diversion insight; precise, calm, accountable.
- **Brand voice:** concise, action-led, factual. Examples: “Collection activity, without the guesswork.” “Simulation is active; no live devices are connected.”
- **Wordmark/mark:** custom SVG circular material-flow mark paired with the WasteOps wordmark; no emoji icons.
- **Signature brand color:** dark teal/emerald, balanced against neutral operations surfaces.

### Repository and hosting constraints

The bound WebDev project uses Manus-managed Git while the requested GitHub repository is an existing, separate repository containing only a license. The supported GitHub canonical-transfer flow cannot adopt an existing repository. Do not alter either remote, force-push, or silently substitute a new repository. Continue against the bound project; obtain user direction before any unsupported GitHub transfer. PostgreSQL remains the approved application database; the platform-managed database is MySQL-compatible and must not be silently substituted. Local development will use a PostgreSQL-compatible environment, while managed PostgreSQL credentials/deployment are prerequisites for a hosted persistent deployment.
