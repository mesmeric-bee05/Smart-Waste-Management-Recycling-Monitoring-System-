# Security model, controls and residual risks

## Information boundary

The app contains organization data (staff names/email and role, work schedules, weights/locations, and optional public request contact details). Location/time and resident requests may be sensitive even when sample data is fictional. Production operators must apply a documented retention, access, backup, deletion and incident-response policy under the customer's applicable law; this prototype does not provide legal/compliance advice or certification.

## Threats and implemented controls

| Threat                                  | Current control                                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unauthorized role/tenant access         | Live DB user/organization revalidation; role checks on pages, server actions, services and protected export routes; query filters include `organizationId`; collector writes validate assignment.      |
| Credential guessing/account enumeration | Generic client sign-in error, Argon2id hashes, atomic account lockout counters, in-memory IP/request throttle and rate limiting on public intake.                                                      |
| Request abuse/resource exhaustion       | Strict Zod schemas, streamed 12 KiB public JSON cap, content-type validation, bounded list/export windows, row limit, parameterized Prisma queries and finite DB connection timeout/pool.              |
| XSS/content injection                   | React escaped rendering, no untrusted `dangerouslySetInnerHTML`, restrictive nonce-based CSP, output escaping in CSV, safe static map markers/popups.                                                  |
| Session theft/replay                    | Auth.js signed short-lived database-role-revalidated JWT session configuration, `HttpOnly`/`SameSite`/`Secure` cookie settings and `Cache-Control: no-store` for sensitive responses.                  |
| Accidental audit tampering              | Append events are transactionally paired with business writes; a PostgreSQL trigger rejects UPDATE/DELETE of `AuditLog`. Avoid sensitive payloads in metadata.                                         |
| Inaccurate synthetic/demo data          | Simulation and location provenance are persisted and labeled, with explicit no-live-device notices in UI/export.                                                                                       |
| Dependency/code exposure                | Exact package lock, Next.js security headers, no production source maps, lint/type/unit/E2E/axe CI, full-history Gitleaks CI scanning, npm audit and Dependabot updates; CI actions are commit-pinned. |

## Required production remediations

1. **Identity is not production approved:** `next-auth` 5.0.0-beta is a prerelease. Replace it with a maintained supported stable Auth.js release or an approved OIDC/managed identity provider, then verify callback, cookie, revocation, recovery and account-lifecycle flows. Add MFA for privileged users where the selected provider supports it. The MVP has no self-service password reset or account verification.
2. Replace the per-process in-memory login/public-request limiter with a shared distributed limiter (e.g. a managed Redis/edge/WAF primitive), and configure trusted-proxy/client-IP handling explicitly. Avoid using untrusted `X-Forwarded-For` without a known proxy chain.
3. Provision production PostgreSQL with TLS certificate validation, least-privilege application and separate migration roles, network allowlists, backups/PITR and restore exercises. The sample Docker database and `.env.example` password are local-only. Do not make the seeded demo accounts available to production.
4. Provide stable secret storage and rotation for `AUTH_SECRET` and DB credentials. The build uses only throwaway example values. Do not pass live secrets as image build arguments or bake them into the client.
5. Confirm intended host/proxy trust, request origin/cookie policy, CSP allowlists and security headers against the actual Preview or production origin. `SameSite=None` is used for cross-site HTTPS Preview embedding only; prefer `Lax` on a normal same-site HTTPS site. Never infer Secure from `NODE_ENV`.
6. Add external immutable audit export/retention/alerting if the customer's assurance level requires evidence beyond a trigger protected by normal application privileges. The database owner can disable triggers.
7. Complete a customer-specific privacy/data-classification review, threat-model walkthrough, independent penetration test and backup/recovery exercise before handling non-demo data.

## Security tests and incidents

CI covers unit/business invariants, serial E2E role restrictions, public intake, private report download and WCAG A/AA checks; it is not a penetration test. `npm audit --audit-level=high` currently reports zero known high/critical dependency vulnerabilities in the checked tree, but that result changes over time. Re-run before each release. For suspected exposure: preserve logs, disable affected access through the identity/database operator, rotate compromised credentials via the secret manager, assess access to resident/request records and follow the customer's approved notification process. Do not delete/modify audit rows during incident handling.
