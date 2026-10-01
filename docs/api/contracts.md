# NOVA API contracts

Base path: `/api`. The API returns local sample snapshots and metadata. It keeps biometrics disabled and human review required. All data routes require a server session; see [authentication setup](../03-auth-and-session.md).

## Sessions

- `POST /auth/login`: JSON `{ "email": "operator@example.com", "password": "..." }`. Returns `{ name, email, role, shift, expiresAt, csrfToken }` and a scoped HttpOnly cookie. `expiresAt` is Unix milliseconds. Role input is rejected.
- `GET /auth/session`: returns the validated user view and CSRF token.
- `POST /auth/logout`: requires `X-Nova-CSRF`; returns 204 and clears/revokes the cookie.
- `GET /health`: public `{ ok: true, product: "NOVA", dataSource: "local-sample" }`.

Writes require a configured Origin; data writes and logout also require `X-Nova-CSRF`. Use same-origin credentials. Production cookies require HTTPS.

## Incidents

`GET /alerts` returns `{ items: Alert[], page, pageSize, total }`. Supported filters: `q`, `status`, `severity`, `cameraId`, `from`, `to`, `page`, `pageSize`. Pagination uses positive integers: page ≤ 1,000,000, pageSize ≤ 100. Status is one of `new`, `acknowledged`, `triaging`, `contained`, `closed`, `all`; severity is `critical`, `high`, `medium`, `low`, `all`.

`POST /alerts/:id/ack` allows guards, supervisors, and admins. Only a `new` incident transitions to `acknowledged`; a repeated acknowledgement is idempotent and creates no second audit event. Other states return 409. Missing IDs return 404. The response is the full Alert. Audit identity comes from the authenticated account.

## Cases

`GET /cases/:id` allows analysts, supervisors, and admins. Returns the Case with hydrated alerts, evidence, and audit records, including explicitly linked record IDs.

`POST /cases` accepts only these fields:

```json
{
  "title": "Manual review",
  "priority": "priority-2",
  "status": "active",
  "location": "Library",
  "summary": "Operator observations",
  "protocol": "Snapshots and metadata; human review",
  "leadAnalyst": "Assigned analyst",
  "alertIds": [],
  "evidenceIds": []
}
```

Returns 201 and the hydrated Case. Title, location and leadAnalyst are required trimmed text ≤ 200 characters; summary ≤ 5,000; protocol ≤ 2,000. Priorities: `priority-1`, `priority-2`, `priority-3`. States: `active`, `monitoring`, `escalated`, `closed`. Optional link arrays contain ≤ 100 valid existing record IDs, deduplicated on save. Unknown fields are rejected. Assignment labels do not control audit identity. Failed persistence returns 503 and rolls back the entire mutation and sequence.

## Search and audit

`GET /search` supports `q`, `cameraId`, `class`, `from`, `to`, `status`, `severity`. Returns `{ alerts, cases, evidence, audit, cameras, zones }`. Direct case text search includes cases with no related incidents. Record filters restrict related cases. Guards receive empty case/audit arrays, while retaining incident snapshots for review.

`GET /audit` allows analysts, supervisors, and admins. Supports `entityType`, `entityId`, `page`, `pageSize`. Returns a paginated audit list. Entity types: `alert`, `case`, `evidence`, `simulator`, `all`.

Date filters accept ISO dates or timestamps with timezone; invalid dates and reversed ranges return 400. `q` is at most 300 characters; other text filters at most 100. Repeated, structured, or unknown query parameters return 400. IDs use letters, numbers, hyphens and underscores, at most 100 characters.

## Errors and limits

Security OS adds authenticated assessments, mission proposals, supervisor decisions, and sequential outcome recording. See the [Security OS API contract](../09-security-os.md#api-contract) for request bodies, lifecycle, provenance and capacity limits.

Error envelope: `{ message, code, requestId }`. Responses disable caching and include `X-Request-ID` and security headers. Internal paths, stack traces, password hashes and raw proxy HTML are not returned.

- 400: invalid JSON, query, body, enum or reference
- 401: invalid credentials, missing/revoked/expired session
- 403: permission, Host, Origin or CSRF rejection
- 404: unknown record or API route
- 409: invalid incident/mission transition, conflicting mission revision, duplicate open mission, or stale assessment
- 413: JSON body over 32 KB
- 415: non-JSON or unsupported encoding
- 429: request/sign-in rate limit (`Retry-After`)
- 503: authentication unconfigured, storage unavailable, session/database capacity reached

Requests use 15-second server timeouts and a 12-second client timeout. The optional simulator is opt-in; intervals must be 1–3,600 seconds and a failed event save pauses it. It writes sample records only. Persistence and sessions are single-process; production infrastructure requirements are documented separately.
