# NOVA Dashboard

Vite, React, TypeScript, and Tailwind v4 for NOVA, the Strathmore-facing operations dashboard by DAMA LTD.

## Overview

This repo now ships with a lightweight local end-to-end setup:

- React dashboard for `/ops`, `/alerts`, `/cases/:id`, and `/search`
- Local Express API under `/api`
- JSON-backed storage with first-run seeding from `server/data/seed.json`
- Ingestion simulator that rotates alert inserts from `server/data/mock-events.ndjson`
- Evidence constrained to still snapshots plus metadata only

Compliance guardrails are enforced throughout the UI and simulator:

- No raw video is stored or returned
- Biometrics are disabled
- Facial recognition and identity inference are not implemented
- Human analyst validation remains required

## Project Structure

```text
src/
  api/              Typed frontend API clients and mock fallback
  app/              Router setup
  components/       Layout, shared, domain, and UI components
  data/             Mock fallback dataset when VITE_USE_MOCK=true
  hooks/            Async data hooks
  lib/              Utilities and compliance copy
  pages/            Route-level pages
  types/            Shared domain types
server/
  data/             Seed data and simulator event feed
  db.js             JSON-backed storage layer
  index.js          Local API server
  simulator.js      Rotating ingestion simulator
scripts/
  dev.mjs           Cross-platform dev runner for web + API
  rename-to-dama.*  Safe repo rename helpers
docs/
  api/contracts.md  API endpoint and payload contract
```

## Branding

- Product name: `NOVA` or `NOVA AI`
- Company attribution: `DAMA LTD`
- Strathmore-facing UI copy should read as Strathmore Security Operations by DAMA LTD

## Development

Install dependencies:

```bash
npm install
```

Start the web app and local API together:

```bash
npm run dev
```

Run the API only:

```bash
npm run dev:server
```

Run the web app only:

```bash
npm run dev:web
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Audit for forbidden orange/amber Tailwind classes:

```bash
rg -n "orange-|amber-" src
```

This should return no matches.

## Environment Variables

- `VITE_USE_MOCK=true`
  Uses the in-browser fallback dataset in `src/data/mock-data.ts` instead of the local API.
- `DAMA_API_PORT=8787`
  Overrides the local API port. Vite proxying follows the same value in development.
- `SIMULATOR_INTERVAL_MS=8000`
  Controls how often the ingestion simulator inserts a new alert.
- `SIMULATOR_ENABLED=false`
  Disables the rotating simulator while leaving the API available.

## Evidence Model

Evidence is represented as:

```ts
{
  snapshotUrl: string
  metadata: {
    cameraId: string
    zone: string
    ts: string
    bboxList: BoundingBox[]
    classes: string[]
    confidence: number
    biometricsDisabled: true
    humanValidationRequired: true
    source: 'snapshot'
  }
}
```

Raw video is intentionally excluded.

## Notes

- Placeholder snapshots are stored under `public/evidence/`.
- Runtime API state is written to `server/data/db.json` and is not committed.
- The repository package name is `dama-dashboard`.
