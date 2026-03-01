# NOVA Dashboard

NOVA is a minimum working dashboard for DAMA LTD's Strathmore-facing security operations workflow. The current build includes a local login flow, a shared operator shell, and placeholder-backed modules for Ops Command, Live Queue, Alerts, Cases, Reports, Search, Mobility, Campus, and Administration.

The product is demo-safe by design. It uses still snapshots plus metadata only, keeps biometrics disabled, and does not connect to real CCTV, PII, or identity-resolution services.

## Current status

- Minimum working dashboard with local login and role-gated routes
- Frontend pages are implemented, but most module data is placeholder/mock data
- Default build mode uses in-browser mock data
- Optional local Express API and simulator exist for richer local demos
- No production auth, no real integrations, no live campus data sources

## Tech stack

- Vite 7
- React 19
- TypeScript 5
- React Router 7 (`createBrowserRouter`)
- Tailwind CSS v4
- shadcn-style local UI primitives under `src/components/ui`
- Lucide icons
- Express 5 local demo API under `server/`
- State management: React context + component state only

## Quick start

Install dependencies:

```bash
npm install
```

Start local web + local API:

```bash
npm run dev
```

Start web only:

```bash
npm run dev:web
```

Start API only:

```bash
npm run dev:server
```

Build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

Optional repo test script:

```bash
npm run test:action-gradient
```

## Environment variables

Copy `.env.example` to `.env` if you want to override defaults.

| Variable | Required for local dev | Required for static preview hosting | Purpose |
| --- | --- | --- | --- |
| `VITE_USE_MOCK` | Recommended | Yes | Frontend data source switch. Any value other than `false` keeps the app on the in-browser mock client. |
| `DAMA_API_PORT` | Only if changing port | No | Local Express API port and Vite dev proxy target. |
| `SIMULATOR_ENABLED` | Optional | No | Enables/disables the local alert-ingest simulator. |
| `SIMULATOR_INTERVAL_MS` | Optional | No | Local simulator tick interval in milliseconds. |

Auth is mocked/local-only. There are no auth secrets, OAuth keys, or backend identity providers in this repo.

## Route map

Public:

- `/login`

Authenticated shell:

- `/ops`
- `/queue`
- `/alerts`
- `/cases`
- `/cases/:id`
- `/reports`
- `/vehicles`
- `/traffic`
- `/zones`
- `/events`
- `/exports`
- `/audit`
- `/users`
- `/settings`
- `/search`

Role access is enforced in the router. Guards, analysts, supervisors, and admins land on different allowed surfaces after login.

## Deployment preview

For stakeholder preview deploys on Vercel or Netlify, build with:

```bash
VITE_USE_MOCK=true
```

Reason:

- Static hosts in this repo do not include the local Express API
- The production build calls `/api/*` only when `VITE_USE_MOCK=false`
- There are no serverless routes or rewrites included for Vercel/Netlify

Safe preview workflow:

1. Set `VITE_USE_MOCK=true`.
2. Run `npm run build`.
3. Deploy `dist/`.
4. Share it as a demo-only preview.

If you want API-backed previews, you need a separate Node deployment for `server/` plus matching routing/proxy work. That is not implemented in this repo.

## Security notes

- No raw video storage
- No facial recognition
- No biometric identification
- No real CCTV or campus integrations
- No production session backend
- Demo-safe placeholder imagery only under `public/evidence/`

## Repo map

```text
src/
  api/         frontend API selector, HTTP client, mock client
  app/         route definitions and role/access metadata
  components/  layout shell, feature components, shared primitives, UI wrappers
  data/        in-browser placeholder datasets
  hooks/       async and theme hooks
  lib/         auth, storage, formatting, compliance helpers
  pages/       route-level screens
  theme/       Strathmore token setup and theme application
  types/       shared domain contracts
server/
  data/        seed data, mutable local db, simulator feed
  db.js        local JSON-backed data layer
  index.js     Express API
  simulator.js mock alert ingestion loop
docs/
  00-08*.md    architecture and workflow documentation
  adr/         architecture decision records
  api/         endpoint contracts
```

## Documentation

- `docs/00-overview.md`
- `docs/01-architecture.md`
- `docs/02-routing-and-layout.md`
- `docs/03-auth-and-session.md`
- `docs/04-ui-system.md`
- `docs/05-features.md`
- `docs/06-dev-setup.md`
- `docs/07-deploy-preview.md`
- `docs/08-adr.md`
- `docs/api/contracts.md`
