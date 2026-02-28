# DAMA LTD Dashboard

Vite, React, TypeScript, and Tailwind v4 for the DAMA LTD operations dashboard.

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

## Folder Rename

The repo directory should be renamed from `nova-dashboard` to `dama-dashboard`.

Because Windows shells can hold locks on the current working directory, the rename is handled by helper scripts:

- PowerShell: `./scripts/rename-to-dama.ps1`
- Bash: `./scripts/rename-to-dama.sh`

Default behavior is dry-run only. Each script prints the filesystem and git remote commands it would run. Re-run with `-Apply` or `--apply` to execute after confirmation prompts.

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
