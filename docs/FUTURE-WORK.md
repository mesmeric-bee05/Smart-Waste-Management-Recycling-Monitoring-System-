# Future work — explicitly outside this software MVP

Prioritize discovery and customer decisions before engineering these integrations. None of the following is represented as present or connected in the current code.

1. **Production identity and security:** select stable identity/MFA, recovery/account lifecycle, distributed rate limiting, customer-specific tenant policy, external audit retention, secrets/DB-provider rotation, security testing and measured restore exercises.
2. **Validated location operations:** approve official point inventory, geocoding/coordinate review, role-based region ownership and the OpenStreetMap tile/service plan. Do not treat seeded coordinates as survey data.
3. **Real sensors and edge devices:** decide device type/protocol, device identity/certificate lifecycle, network model, message broker, signed payloads, schema/versioning, replay and idempotency strategy, offline queue, firmware and command safety. No MQTT, RFID or physical bin connector exists now.
4. **Live fleet GPS and dispatch:** define vehicle/driver identity, legal/privacy retention, consent, map/geocoding provider, road-network route engine, real ETA constraints, safety reviews and dispatch integrations. The current straight-line nearest-neighbor order is only a human-reviewed visualization.
5. **Industrial facility integration:** separately scope weighing/receiving, sorting machinery and external SCADA/PLC interfaces with hazard analysis, hardware isolation and certified operator approvals. Do not connect this web app to plant control.
6. **Environmental methodology:** customer-approved source/region/year-specific emissions factors and verification pipeline. Current 2.5 factor is illustrative and must not be used for reporting/claims as measured impact.
7. **Advanced service channels:** approved transactional email/SMS provider, templates, consent, delivery retries/outbox, rate/abuse controls, receipts and support SLAs. No external notification service is configured.
8. **Mobile/offline operations:** separate native app/PWA decision, device management, secure offline cache, conflict resolution and accessible field workflow. Current app is responsive web UI, not a complete native/offline client.
9. **Forecasting/analytics:** data quality and historical baselines first; only then consider explainable demand forecasting or facility prediction, with validation, monitoring, bias/security/privacy review and human override. No ML/AI feature is implemented.

Keep each addition behind explicit interfaces and customer acceptance criteria, and preserve the software-only MVP's visible provenance and fail-safe manual pathways.
