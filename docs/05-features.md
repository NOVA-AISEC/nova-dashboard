# Features

## Feature summary

This section describes what each module does today, not what it is intended to do later.

## Ops Command (`/ops`)

Current behavior:

- Loads `api.search('')`
- Derives metrics from open alerts and case validation flags
- Displays campus context cards from placeholder data
- Displays compliance notices
- Shows the shared `AlertTable` for open alerts
- Shows active case cards with links to case detail
- Stores handover notes in localStorage
- Exports a shift brief using local data and the current operator name

Local state:

- `dama-sentinel.shift-notes`

Placeholder level:

- Medium. The workflow is interactive, but the underlying data is mock/demo data.

## Live Queue (`/queue`)

Current behavior:

- Loads `api.search('')`
- Derives queue metrics from open alerts
- Reuses `AlertTable`
- Shows a dispatch board using the first open alerts
- Shows recent cases as an "incident desk watch"

Placeholder level:

- Medium. It is a functional read surface over mock/demo data.

## Alerts (`/alerts`)

Current behavior:

- Loads metadata from `api.search('')`
- Loads paginated alerts from `api.listAlerts(...)`
- Supports severity, status, camera, date, and text filtering
- Uses `useDeferredValue` for the query
- Can acknowledge an alert through `api.ackAlert(id)`
- Re-runs the list via a local `refreshKey`

Placeholder level:

- Medium. Filter and acknowledge flows work, but data source is mock by default.

## Cases (`/cases`, `/cases/:id`)

Current behavior:

- List page loads `api.search('')` and renders sorted case cards
- Detail page loads `api.getCase(id)`
- Detail page shows summary metrics, overview, timeline, evidence viewer, and linked alerts
- Missing case IDs render a custom "Case not found" card

Placeholder level:

- Medium. Case navigation works, but the records are placeholder-backed.

## Reports (`/reports`)

Current behavior:

- Form for category, zone, priority, and summary
- Reporter defaults to the current session user
- Saves locally to browser storage
- Re-renders a "Recent reports" list from that same local state

Local state:

- `dama-sentinel.incident-reports`

Placeholder level:

- High. This is a purely local capture surface with no backend persistence.

## Snapshot Search (`/search`)

Current behavior:

- Stores query in URL search params (`?q=...`)
- Uses `startTransition` when updating search params
- Uses deferred query execution
- Filters alerts/evidence/cases through `api.search(...)`
- Renders evidence cards with snapshot image, metadata, and linked case CTA

Placeholder level:

- Medium. The workflow is real, but the search corpus is placeholder-backed.

## Vehicles (`/vehicles`)

Current behavior:

- Local filter form for zone, vehicle type, and free text
- Explicit "Run search" action copies draft filters into active state
- Filters placeholder `vehicleSightings`

Placeholder level:

- High. Read-only local filtering only.

## Parking / Traffic (`/traffic`)

Current behavior:

- Read-only metrics and advisory cards from placeholder traffic records

Placeholder level:

- High.

## Zones & Cameras (`/zones`)

Current behavior:

- Read-only zone/camera health cards
- Displays alert count and last-checked timestamp per zone

Placeholder level:

- High.

## Events (`/events`)

Current behavior:

- Read-only event cards with status, crowd level, and start time

Placeholder level:

- High.

## Evidence Exports (`/exports`)

Current behavior:

- Read-only export package cards from placeholder records
- Links back to `/search` for creating a new export flow later

Placeholder level:

- High.

## Audit Log (`/audit`)

Current behavior:

- Loads `api.listAudit({ page: 1, pageSize: 25 })`
- Renders a simple table of recent actions

Placeholder level:

- Medium in local API mode, medium/high in mock mode depending on what actions were simulated.

## Users & Roles (`/users`)

Current behavior:

- Read-only roster of placeholder users and access scopes
- No edit flow

Placeholder level:

- High.

## Preferences (`/settings`)

Current behavior:

- Theme toggle
- Default zone selector
- Toggle flags for auto-print and compact table density
- Writes values directly to localStorage

Local state:

- `dama-sentinel.preferences`

Placeholder level:

- High. These settings are local browser preferences only.
