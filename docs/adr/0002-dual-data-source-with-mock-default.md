# ADR 0002: Dual data source with mock mode as the default

## Status

Accepted

## Context

The dashboard needs to run both as a lightweight frontend-only preview and as a richer local demo with an API and simulator.

## Decision

Keep a single frontend API surface in `src/api/index.ts` and switch implementation by `VITE_USE_MOCK`.

- `VITE_USE_MOCK=false` -> `src/api/client.ts`
- any other value or unset -> `src/api/mock-client.ts`

## Consequences

- Static previews are easy and safe because mock mode is the default.
- Frontend pages can stay unaware of the actual data source.
- The local API remains optional rather than mandatory.
- API mode requires extra deployment work outside local development.
