# NOVA Overview

## What this repo is

NOVA is a demo-safe campus security operations dashboard for DAMA LTD. It is currently a minimum working dashboard with:

- A local-only login screen
- A role-gated React application shell
- Placeholder-backed modules for operations, alerts, cases, reports, search, mobility, campus status, and admin views
- An optional local Express API and simulator for richer local demos

The frontend defaults to mock data. No real CCTV feeds, identity systems, or external APIs are connected.

## Current implementation boundary

Implemented now:

- Login page with local validation and role inference
- Auth context, route guards, redirect behavior
- Shared sidebar/header shell
- Readable route map across all declared modules
- Search, alert filtering, case detail, evidence viewer, reports, settings, audit, and admin read-only views
- Light/dark Strathmore theme toggle
- Optional local Express API with seeded JSON data and a simulator loop

Placeholder or demo-only behavior:

- Auth is mocked and stored in `localStorage`
- Most modules read from `src/data/*` when `VITE_USE_MOCK` is not `false`
- Reports and settings persist locally in the browser only
- No backend identity, no real persistence service, no live integrations
- Static-host previews should stay in mock mode

## Main product modules

| Module | Route | Current state |
| --- | --- | --- |
| Ops Command | `/ops` | Primary dashboard with metrics, queue, cases, notes, and compliance copy |
| Live Queue | `/queue` | Dispatch-oriented alert queue using placeholder results |
| Alerts | `/alerts` | Filterable alert table with local/mock acknowledge action |
| Cases | `/cases`, `/cases/:id` | List view plus detail workspace, timeline, and evidence viewer |
| Reports | `/reports` | Manual report entry stored in browser localStorage |
| Snapshot Search | `/search` | Search across mock evidence, alerts, and cases |
| Vehicles | `/vehicles` | Local filter UI against placeholder vehicle sightings |
| Parking / Traffic | `/traffic` | Read-only advisory cards |
| Zones & Cameras | `/zones` | Read-only camera/coverage status cards |
| Events | `/events` | Read-only event watch cards |
| Evidence Exports | `/exports` | Read-only export package cards |
| Audit Log | `/audit` | Read-only paginated audit table |
| Users & Roles | `/users` | Read-only RBAC roster cards |
| Preferences | `/settings` | Theme and operator defaults stored locally |

## Data mode summary

```text
Default:
  VITE_USE_MOCK != "false"
  -> src/api/index.ts selects src/api/mock-client.ts
  -> frontend reads in-browser placeholder datasets from src/data/*

Optional local API mode:
  VITE_USE_MOCK=false
  -> src/api/index.ts selects src/api/client.ts
  -> frontend calls /api/*
  -> dev proxy forwards to server/index.js
```

## Evidence and compliance rules reflected in the code

- Evidence is still-image based (`snapshotUrl`)
- Metadata includes camera, zone, timestamp, classes, confidence, and bounding boxes
- `biometricsDisabled` is always `true`
- Human validation is required before escalation/export actions
- UI copy repeats these constraints in shell, login, search, case detail, and export surfaces

## Related docs

- `docs/01-architecture.md`
- `docs/02-routing-and-layout.md`
- `docs/03-auth-and-session.md`
- `docs/04-ui-system.md`
- `docs/05-features.md`
- `docs/06-dev-setup.md`
- `docs/07-deploy-preview.md`
- `docs/api/contracts.md`
