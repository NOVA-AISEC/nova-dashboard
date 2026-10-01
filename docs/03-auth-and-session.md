# NOVA authentication and sessions

NOVA has two explicit modes. `VITE_USE_MOCK=true` is a browser demo with sample records and local role previews. `VITE_USE_MOCK=false` connects to the authenticated Express API. A browser role or localStorage object never grants API permissions.

## Browser demo

Local sessions expire after eight hours. Invalid, expired, and legacy sessions are ignored. Sign-out synchronizes across tabs. Blocked storage keeps sign-in and theme switching usable for the current tab, with a visible persistence message. The demo password gate is a presentation gate: its build-time password is visible to clients and is not a security boundary. It is disabled in API mode.

The authenticated workspace remounts when the account, role, or session expiry changes. Cross-tab account switching and role changes therefore clear cached records, open source dialogs, local assessments, and action drafts before loading the next account's permitted data. Ordinary record refreshes keep the current operator's work in place.

## Account-backed API

Provision an operator interactively from the repository root:

```sh
npm run auth:add-user -- .secrets/users.json supervisor@example.com supervisor "Campus Supervisor"
```

The command reads a password of 12–256 characters from hidden stdin. It writes only a salted scrypt hash (`N=32768`, `r=8`, `p=1`, 64-byte output), using an atomic save. Passwords must not be passed as command arguments. `.secrets/` and `.env` are ignored by Git; restrict their Windows ACLs or Unix permissions to the service owner. Accounts are loaded at startup, so account removal, role changes, and password rotation require an API restart, which also invalidates all sessions. Duplicate accounts and malformed hashes prevent startup.

Copy `.env.example` to `.env`, provision the account, and set `VITE_USE_MOCK=false`. Then run `npm run dev`. Both Vite and the API load the root `.env`. Leave the simulator disabled unless you explicitly need generated sample incidents.

With no configured accounts, protected endpoints return 401 and login returns 503. There is no fallback to demo credentials. API mode starts with blank credentials and hides the preview role selector.

Successful login returns a user view and CSRF token; the opaque session credential is a random 256-bit HttpOnly cookie, never a JSON token or localStorage value. Only a SHA-256 digest of the cookie is retained in the server's in-memory session map. Cookies use `SameSite=Strict`, `/api` scope, and `Secure` in production. Login rotates an existing cookie. Sessions have an absolute eight-hour lifetime by default, configurable from one to 24 hours. Logout deletes the server session. Restart invalidates all sessions. The client revalidates on reload, reacts to API 401s and local expiry, and surfaces failed logout rather than pretending the cookie was revoked.

Writes require an exact allowed Origin and the session's CSRF token in `X-Nova-CSRF`. API requests have an exact Host/origin allowlist, reject cross-site browser requests, and never trust forwarded identity or IP headers. There is no cross-origin credential-sharing configuration: the web app and API must share one public origin through a proxy.

## Permissions

| Endpoint | Allowed accounts |
| --- | --- |
| Health / login | Public, within allowed hosts/origins |
| Session / logout / alerts | Any signed-in role |
| Acknowledge an incident | Guard, supervisor, admin |
| Read/create cases / audit | Analyst, supervisor, admin |
| Search / campus pulse | Any signed-in role; guards receive no case or audit records |

Case audit actors come from the authenticated account. `leadAnalyst` is an assignment label, not an identity claim. Frontend route guards remain navigation controls; the server is authoritative for API access.

## Limits and deployment

Login permits five failed attempts per account and 30 attempts per IP in 15 minutes; all API routes have a 300-request/IP/minute limit. Counters and sessions have bounded capacity and expire. These limits are per process. Behind a proxy, the proxy's IP is used deliberately; use an edge rate limiter for larger deployments.

The API binds only to `127.0.0.1`. Production startup requires configured accounts and explicit HTTPS `DAMA_ALLOWED_ORIGINS`. Place a TLS proxy in front, preserve the original Host and Origin, and route `/api` to the loopback API. Keep the process off the public network. Static Vercel preview configuration serves the browser demo and includes security headers; it does not deploy this Express service.

The JSON database uses fsync + atomic rename, rolls back mutations after failed saves, validates state at startup, and has a 32 MB ceiling. A lock file prevents two normal API instances opening the same file. An unclean shutdown can leave a stale `.lock`: verify the recorded owner is no longer running before removing that lock. Corrupt data fails closed and is preserved for recovery; restore a verified backup rather than resetting it. Back up the database before upgrades. This is a single-process local service, not a replicated datastore.

Remaining production work includes campus SSO/MFA, shared sessions and transactional storage, backups and recovery drills, monitored ingress/service health, retention controls, and real camera/dispatch integrations. Reports, notes, preferences, roster and reference inventory still use browser-local/sample data. Do not enter real incident or personal data into this preview.

## Verification

`npm run test:api` exercises direct HTTP authentication, role forgery, CSRF, origin/Host rejection, expiry, rate limits, input errors, idempotency, standalone case discovery, linked records, safe errors, atomic persistence and failed-save rollback against temporary files. `npm run test:resilience` covers client sessions, safe navigation, API errors, transport and invalid local caches. `npm run test:account-boundary` mounts the real React authentication, data hooks, Command, and Missions in jsdom and dispatches browser storage events to verify account/role/session changes clear prior data, dialogs, and drafts. CI runs these alongside the existing operator tests, lint, dependency audit and build.
