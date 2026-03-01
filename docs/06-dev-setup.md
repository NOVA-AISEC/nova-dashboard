# Dev Setup

## Requirements

- Node.js compatible with Vite 7 / current repo lockfile
- npm

## Install

```bash
npm install
```

## Local development modes

### Default local mode

```bash
npm run dev
```

This starts:

- `npm run dev:server`
- `npm run dev:web`

The helper script is `scripts/dev.mjs`.

### Web only

```bash
npm run dev:web
```

Use this when you are staying in mock mode.

### API only

```bash
npm run dev:server
```

Use this when inspecting local API responses or simulator behavior.

## Build and preview

```bash
npm run build
npm run preview
```

Important:

- `vite preview` serves the built frontend only
- it does not start `server/index.js`
- if you build with `VITE_USE_MOCK=false`, the preview build will expect `/api/*` on the same origin

## Lint and available tests

Lint:

```bash
npm run lint
```

Available repo test script:

```bash
npm run test:action-gradient
```

There is no broader automated test suite in the repo today.

## Environment setup

Use `.env.example` as the source of truth.

### Local dev values

Mock mode only:

```dotenv
VITE_USE_MOCK=true
```

Frontend + local API:

```dotenv
VITE_USE_MOCK=false
DAMA_API_PORT=8787
SIMULATOR_ENABLED=true
SIMULATOR_INTERVAL_MS=8000
```

## Mutable local data

When the local API runs:

- seed data originates from `server/data/seed.json`
- runtime changes are written to `server/data/db.json`
- simulator templates come from `server/data/mock-events.ndjson`

This means API mode is stateful across runs until `db.json` is reset manually.

## Suggested working modes

For UI review and stakeholder-safe demos:

- use mock mode

For checking API contracts and simulator behavior:

- use `VITE_USE_MOCK=false`
- run both frontend and server locally
