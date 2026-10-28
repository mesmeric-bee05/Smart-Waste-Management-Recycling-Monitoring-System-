# Customer MVP boundary

## Included in the time-boxed software-first MVP

- Role-based Admin, Supervisor and Collector account experience.
- Organization-scoped collection-point register with editable/deactivatable points, validated coordinates, explicit location provenance, map and text/list equivalent.
- Scheduling/assignment and guarded collection status transitions, including per-material non-negative kilogram capture, status timestamps and operational audit records.
- Server-computed activity/recycling dashboard with UTC period, zone and material filters, chart interpretation, capped reads and explicit source/quality labels.
- Public collection-request submission and authorized OPEN → ACKNOWLEDGED → RESOLVED/REJECTED review. The software does not claim dispatch, response SLA, email or SMS.
- Admin audit viewer and role-authorized, bounded CSV/PDF reports with formula-injection prevention, filters, summaries, actor/generation time and estimate notes.
- OpenStreetMap map, simulated-only bin/vehicle samples and an accessible, straight-line nearest-neighbor route-order preview requiring a human review.
- Dynamically loaded, optional, low-motion 3D visual enhancement with a 2D/list equivalent.

## Explicitly not part of this delivery

No physical bin hardware, live sensor reading, live GPS, fleet dispatch, road-routing engine, MQTT, RFID, device credentials, industrial PLC/SCADA control, plant process automation, image recognition, predictive ML, carbon measurement, legal/regulatory certification/submission, native mobile/offline workflow, external notifications, analytics SaaS integration or production-grade identity operation has been implemented.

## Honest-data rules

Seeded addresses, coordinates, staff, weights, collection jobs, readings and vehicle positions are fictional. They remain clearly `SIMULATED` in user-visible screens and reports. Manual measurements need their own time/source/user context. A `MANUAL` coordinate label requires explicit review attestation. Missing/stale/suspect information is not converted to a live state or silently used as a verified measurement.

The CO₂e number is an illustrative calculation at 2.5 kg CO₂e for each kg of the selected recyclable categories. It has not been sourced for a customer region/year, independently validated or measured. Do not use it for marketing, offset accounting, compliance, contractual performance or environmental claims. Replace only after the customer approves a traceable methodology.

## Acceptance standard

The deployed product should preserve the complete feature-specific clauses in [`TODO.md`](../TODO.md). Acceptance requires role/tenant behavior enforced server-side, accessibility alternatives, unit-bearing data and provenance labels, auditable state changes, CSV/PDF risk controls and no implication that future integrations are already active. User sign-off and production-readiness gates remain separate from a local code build.
