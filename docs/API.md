# API surface

All endpoints use relative-origin paths. Backend API endpoints are intentionally excluded from `public/manus-routes.json`, which declares page routes only.

| Method/path                                                                                   | Access                       | Behavior                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/requests`                                                                          | Public, IP/request throttled | Accepts a JSON collection request, streams a maximum 12,000-byte body, validates fields and optional active point, creates the request and audit event transactionally, and returns only a short reference/time. It does not send email/SMS/dispatch.                                             |
| `GET /api/reports/export?format=csv\|pdf&from=YYYY-MM-DD&to=YYYY-MM-DD&zone=...&category=...` | Admin/Supervisor             | Validates UTC date window (maximum one year), bounds export to 10,000 material rows, filters by organization, records actor/export audit event and returns private, no-store CSV or PDF. CSV cells neutralize formula prefixes. PDF caps detail rows at 2,000 but labels its full-result summary. |
| `POST /api/simulation/tick`                                                                   | Authorized Admin/Supervisor  | Creates only deterministic sample bin readings and vehicle pings using explicit SIMULATED provenance, idempotency keys, and rate controls. This is not an ingestion endpoint for real devices.                                                                                                    |
| `GET /api/health`                                                                             | Public, no auth              | Checks `SELECT 1` and returns a constant status body; never discloses database errors or secrets.                                                                                                                                                                                                 |
| `/api/auth/*`                                                                                 | Auth.js callbacks            | Credentials login/session callback. User session role is revalidated from the live database in protected server paths.                                                                                                                                                                            |

Collection points, collections, requests, staff administration and report access are performed through server actions/services or the protected export route. Zod validates mutations on the server; client-side form constraints are usability aids, not trust boundaries.

## Public request body

```json
{
  "requesterName": "optional, maximum 80 characters",
  "contactEmail": "optional, valid email",
  "message": "required, 12–1000 characters",
  "pointId": "optional active collection-point UUID"
}
```

No request body is included in audit metadata. Errors are intentionally generic where returning details could disclose the existence/status of internal records.
