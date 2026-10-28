# External References and Package Evidence

**Package versions checked:** 2026-10-28. **GitHub Actions and secret-scanning references checked:** 2026-10-29. This ledger records the customer-provided software/design repositories and the package versions resolved for this MVP. It is not a certification or a claim that every linked package is production-supported.

## Customer project sources

1. **Project definition repository (customer supplied):** [mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-](https://github.com/mesmeric-bee05/Smart-Waste-Management-Recycling-Monitoring-System-). Read-only inspection of `main` on 2026-10-28 found a `LICENSE` and no application source, build configuration, tests, or schema. The project must therefore be treated as a new implementation, not as a repair of existing software. Repository ownership and access remain controlled by the customer.
2. **UI/UX design source (customer supplied):** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). Its README describes it as “An AI skill that provides design intelligence for building professional UI/UX across multiple platforms and frameworks.” The installed skill’s “Rule Categories by Priority” identifies accessibility as critical and names contrast, alt text, keyboard navigation, and labels as checks; it also calls for mobile-first responsive behavior, visible focus, reduced-motion support, labeled forms, and accessible charts. Its workflow says use `--design-system` for system-wide visual direction and persist a project master design system. This project follows those practices and stores the generated, project-specific result in [`design-system/circular-operations/MASTER.md`](../design-system/circular-operations/MASTER.md).
3. **Customer requirements documents:** the uploaded `compdefinitionproject1(1).pdf` and `Professionalimplementationblueprintandmasterdevelopmentprompt.docx` are the product source of truth. Their attachments are supplied in this Manus task. The MVP boundary in `docs/MVP-BOUNDARY.md` reflects the technical feasibility decision to ship the software-first slice and explicitly label simulated data.

## Package-version evidence

Exact direct dependencies and transitive resolutions are recorded in `package.json` and `package-lock.json`. Versions were checked against the public npm registry (`npm view`) on the date above; the lockfile is the executable source of truth.

- [Next.js](https://www.npmjs.com/package/next) 16.4.3; [React](https://www.npmjs.com/package/react) and `react-dom` 19.3.1.
- [Prisma Client](https://www.npmjs.com/package/@prisma/client) and Prisma CLI 7.10.1; PostgreSQL connectivity uses `pg` through `@prisma/adapter-pg` 7.10.1.
- [Zod](https://www.npmjs.com/package/zod) 4.6.7; [Recharts](https://www.npmjs.com/package/recharts) 3.10.1; [Leaflet](https://www.npmjs.com/package/leaflet) 1.9.4 and React Leaflet 5.0.0.
- [React Three Fiber](https://www.npmjs.com/package/@react-three/fiber) 9.8.2, Drei 10.7.9, and Three.js 0.186.1; loaded only when the user enables the optional visualization.
- [@react-pdf/renderer](https://www.npmjs.com/package/@react-pdf/renderer) 4.9.0; [Argon2](https://www.npmjs.com/package/argon2) 0.45.1.
- [Vitest](https://www.npmjs.com/package/vitest) 5.0.5; [Playwright](https://www.npmjs.com/package/@playwright/test) 1.64.1; Prettier 3.9.10.
- Auth.js is integrated through [`next-auth`](https://www.npmjs.com/package/next-auth) **5.0.0-beta.32**. The explicit `beta` tag means the selected v5 package is a prerelease, not a general-availability release. The implementation is appropriate for the scoped local demonstration and must not be represented as an approved production identity provider; deployment requires security review and either a stable approved identity service or a verified stable Auth.js release.

## Evidence boundaries

- A package-registry version lookup is not an independent security review; run `npm audit` and review upstream advisories before releases.
- A successful local build, test, migration, or preview does not establish production resilience, certification, availability, or compliance.
- Package selection does not imply that the project has live IOT devices, GPS, notifications, hosted PostgreSQL, or production credentials.

## Additional verified implementation sources

The project’s UI/UX Pro Max design query did run and was persisted, but the returned master file identifies its product category as “LMS (Learning Management System)” and recommends an academic serif treatment. That result is not a good match for the customer’s civic-operations software. It is retained for traceability, not treated as authoritative. The app’s product-specific overrides should retain the reference skill’s accessibility, responsive layout, labeled-form, and reduced-motion guidance while following the uploaded blueprint’s Inter-style interface and data-focused typography. See the `pages/` overrides before extending the UI.

Prisma’s official upgrade guide says, “Prisma ORM v7 introduces breaking changes when you upgrade from an earlier Prisma ORM version.” It specifies upgrading both `prisma` and `@prisma/client`, moving CLI configuration into `prisma.config.ts`, providing a custom generated-client output, accounting for ESM, and supplying a database driver adapter. The official database driver guide documents PostgreSQL through `@prisma/adapter-pg` and the connection string passed to the adapter. The earlier high-severity `deepmerge-ts` advisory in the Prisma 6 dependency tree prompted the upgrade; WasteOps now pins Prisma 7.10.1 and has verified client generation, local PostgreSQL migrations and the Next.js build. The advisory is [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx); the current `npm audit --audit-level=high` run found zero vulnerabilities, which is not an independent security certification. [1] [2] [3]

Next.js’ official Proxy reference states, “The middleware file convention is deprecated and has been renamed to proxy.” It specifies a `proxy.ts` file exporting a named `proxy` function and allows the existing matcher configuration alongside it. The official migration page describes the source change as renaming the file and the function. WasteOps uses Proxy only to attach a nonce-based CSP; authentication and authorization remain inside server-side actions, route handlers, and data services. [4] [5]

[1]: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 "Prisma ORM 7 upgrade guide"
[2]: https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers "Prisma ORM 7 database driver adapters"
[3]: https://github.com/advisories/GHSA-ggr8-5vv4-36mx "DeepmergeTS recursive merge advisory"
[4]: https://nextjs.org/docs/app/api-reference/file-conventions/proxy "Next.js Proxy file convention"
[5]: https://nextjs.org/docs/messages/middleware-to-proxy "Next.js middleware to Proxy migration"

Prisma ORM 7’s official PostgreSQL pool guide documents `pg`’s default pool maximum of 10, but its default acquire/connect timeout is 0 (no timeout) and idle timeout is 10 seconds. WasteOps explicitly sets a maximum of 10 connections per application instance, a 5-second connection timeout and a 30-second idle timeout rather than inheriting an unlimited wait. This pool size must be revisited against the selected hosted PostgreSQL provider and number of app instances before production rollout; serverless deployments may require an external pooler. [6]

[6]: https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-pool "Prisma ORM 7 connection-pool guide"

## CI and secret-scanning evidence

The official Gitleaks Action documentation identifies v3 as running on Node 24 and requires current GitHub-hosted runner versions. It states that a license key is not required for personal accounts but is required for organization-owned repositories. The CI job therefore supplies the optional encrypted `GITLEAKS_LICENSE` secret, disables PR comments and uploaded finding artifacts, and requests only `contents: read`. A Gitleaks installation was not available in the local sandbox; this workflow job has not yet executed on the customer's GitHub repository. [7]

The official `actions/checkout` and `actions/setup-node` repositories document their current v7 majors and Node 24 action runtime. The pipeline runs the application itself on Node 22 and pins all three third-party actions to commit IDs resolved from their v7/v3 tags on 2026-10-29; Dependabot is configured to propose later updates. [8] [9]

[7]: https://github.com/gitleaks/gitleaks-action "Gitleaks GitHub Action"
[8]: https://github.com/actions/checkout "GitHub checkout action"
[9]: https://github.com/actions/setup-node "GitHub setup-node action"
