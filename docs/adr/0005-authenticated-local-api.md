# ADR 0005: Authenticate the local API and preserve a separate browser demo

## Status

Accepted

## Context

The operator redesign makes incident acknowledgement and case creation usable. The previous Express API exposed those writes without authentication, accepted loosely typed input, overwrote response states, and persisted by truncating a shared JSON file. Frontend role guards do not protect HTTP endpoints.

## Decision

Keep static browser mock mode available for sample demonstrations. In HTTP mode, require configured accounts with salted scrypt password hashes, expiring opaque HttpOnly-cookie sessions, server role checks and CSRF/origin verification. Do not infer API roles from email or browser state. Bind the API to loopback and require explicit HTTPS origins and accounts in production.

Validate request bodies, references, IDs and queries. Keep acknowledgement idempotent and restricted to new incidents. Derive audit actors from the authenticated account. Search cases directly as well as through evidence links.

Use atomic fsynced writes and roll back the in-memory transaction when persistence fails. Validate database files at startup; reject corruption without overwriting it. Bound file/collection sizes and acquire a lock for the server's lifetime to prevent concurrent writers. Keep simulation opt-in and stop it after a failed save.

## Consequences

- API consumers must sign in and send the session CSRF token for writes. Existing unauthenticated clients must migrate.
- Static previews remain browser demos; they do not ship the Express API or server secrets.
- The API supports one process and one database owner. Sessions and rate limits are in memory; restart invalidates sessions. An unclean shutdown may require verified stale-lock recovery.
- Account setup is interactive and hashes passwords; secrets stay outside Git. Account changes require restart.
- This provides a hardened local service, not campus SSO/MFA, a distributed datastore, or a completed production deployment. Shared storage, edge controls, monitored health, retention and tested backups remain deployment work.
- Regression tests isolate HTTP requests and temporary data from the user's local database.

See [authentication and deployment](../03-auth-and-session.md) and [API contracts](../api/contracts.md).
