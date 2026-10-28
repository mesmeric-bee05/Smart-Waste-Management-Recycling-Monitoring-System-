# Architecture and data model

## Runtime shape

The application is a modular monolith. Next.js App Router renders server components and accepts server actions/route handlers. `src/domain` contains validation and deterministic, database-free rules; `src/server` contains identity, authorization, audit persistence, services, rate limiting and reporting queries; `src/components` contains accessible React UI. PostgreSQL is the canonical persistence boundary. Prisma 7 generates a typed ESM client into `src/generated/prisma` from `prisma/schema.prisma`.

Write flow: browser form or route handler → Zod parse → live server-side identity lookup → role and organization/record ownership check → transactional service update → audit append → revalidation/response. A UI-only role filter is never authorization. Server actions, API handlers, services and pages enforce access again.

Read flow: server query loads the current user and organization from the database and scopes business data to `organizationId`; client components receive deliberately selected projections. Reports load bounded matching rows, compute summaries server-side, add actor/time/window metadata, record an export event and return a private/no-store file.

## Core entities

| Entity                    | Purpose and ownership                                                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization`            | Tenant root and parent of staff, collection points, work, public requests and audits.                                                                                   |
| `User`                    | Email, Argon2id hash, role, active state and organization; contains lockout state for password-guessing controls.                                                       |
| `CollectionPoint`         | Unique organization-scoped code, fictional/entered address, zone, decimal coordinates, location provenance, categories, capacity and active flag.                       |
| `Collection`              | Organization/point, optional assigned collector, schedule, lifecycle, completion timestamps, notes and simulation source.                                               |
| `CollectionMaterial`      | Per-collection material category and non-negative weight in kilograms.                                                                                                  |
| `BinReading`              | Point, fill percent, optional mass/temperature/battery, recorded time, quality/source and idempotency key. Demo records are simulated.                                  |
| `Vehicle` / `VehiclePing` | Fictional vehicle identity and provenance-tagged sample coordinates; no GPS/device link.                                                                                |
| `CollectionRequest`       | Organization-scoped public request, optional point, minimal contact details, status, handler and resolution.                                                            |
| `AuditLog`                | Organization, actor (nullable for public intake), action, entity identifier, minimized JSON metadata and UTC timestamp. A PostgreSQL trigger rejects row update/delete. |

Indexes support tenant/date/status/point reads and idempotent simulated writes. Foreign keys enforce organization, user, point and assignment relationships; services additionally verify ownership and active status. Audit events for a business mutation are written in the same transaction as that mutation, including public submission and report-export events. Raw passwords, auth cookies, tokens and request bodies are never placed in audit metadata. The database owner can still alter schema/disable triggers; therefore this is tamper-resistant for normal application roles, not an external WORM archive.

## Domains and invariants

- Roles are `ADMIN`, `SUPERVISOR`, and `COLLECTOR`. Current role/organization is reloaded from the live user row for protected requests, so a stale JWT role alone does not grant access.
- Work transitions are constrained by `src/domain/collections.ts`; collectors act only on their assigned work. Completion weights are validated as finite, non-negative kilograms and stored by category.
- Coordinates are bounds-checked. Seeded synthetic positions retain `SIMULATED` provenance; an editor must explicitly attest to reviewing coordinates before replacing that label with `MANUAL`.
- Date filters use inclusive UTC calendar dates at the UI/API boundary and a half-open query interval internally. Dashboard/report reads are organization scoped and capped to bound cost.
- `SIMULATED` provenance is stored on readings, pings and seeded collection records. Data views disclose it; stale samples are separate from source quality.
- Material/diversion totals are server-computed from completed collection records. CO₂e uses an explicitly provisional `2.5 kg CO₂e/kg` factor for four material categories; the coefficient is illustrative/configurable and makes no claim of measured savings.
- The route preview uses straight-line Haversine distances and a deterministic nearest-neighbor ordering; it is neither a driving distance nor a dispatch instruction.

## Boundaries and infrastructure

The prototype currently targets PostgreSQL 16 with a bounded Prisma `pg` pool (max 10, 5s connection timeout, 30s idle). App instances multiply that cap; choose pool settings against the actual database and hosting concurrency. Multi-instance rate limiting needs shared infrastructure. Maps use OpenStreetMap standard tiles and must follow the tile provider's attribution/usage policy. The optional R3F scene is dynamically imported, user-disableable, respects reduced motion and never carries sole access to business information.

No event broker or microservice is required for this MVP. Physical-device ingestion, native mobile/offline synchronization, transactional outbox/email, cross-region tenancy, road-network optimization and external analytics are separate phases.
