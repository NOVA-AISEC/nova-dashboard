# ADR 0001: Local auth and browser session storage

## Status

Accepted

## Context

The repo provides a working login experience, but there is no backend identity provider, token issuer, or session service.

## Decision

Use a local mocked sign-in flow in `src/lib/auth.tsx` and persist the resolved session in browser `localStorage` under `nova.session`.

## Consequences

- The app can be demoed without backend auth infrastructure.
- Route guards and role-based routing can still be exercised.
- The experience is explicitly non-production.
- Session integrity is only as strong as the user's browser state.

## Notes

- In development, the login form exposes manual role selection.
- Outside development, the role is inferred from the email prefix.
