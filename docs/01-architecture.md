# Architecture

## Stack identification

- Framework: Vite + React 19 + TypeScript
- Router: `react-router-dom@7` using `createBrowserRouter`
- UI system: Tailwind CSS v4 with shadcn-style generated local primitives in `src/components/ui`
- State library: none beyond React context and local component state
- Optional backend: Express 5 local demo API

## Repo discovery tree

```text
src/
  main.tsx            bootstraps theme variables, renders <App />
  App.tsx             wraps router in AuthProvider
  index.css           global CSS, fonts, component utility classes
  api/
    index.ts          selects mock client vs HTTP client
    client.ts         fetch wrapper for /api endpoints
    mock-client.ts    mock implementation with same call surface
  app/
    access.tsx        route IDs, labels, role access, nav groups
    router.tsx        browser router, auth guards, route handles
  components/
    layout/           authenticated app shell
    ops/              alert table used across Ops/Queue/Alerts/Case detail
    cases/            case timeline and evidence viewer
    shared/           page header, filters, badges, async states, theme toggle
    ui/               local button/card/input/select/badge wrappers
  data/
    mock-data.ts      exported placeholder data facade
    campus-*.ts       underlying mock records
  hooks/
    use-async-data.ts async loader hook
    use-theme-mode.ts theme state sync
  lib/
    auth.tsx          auth context and route guard components
    operator-storage.ts localStorage helpers for notes/reports/preferences
    formatters.ts     display format helpers
    compliance.ts     compliance text helper
    action-gradient.ts, alert-accent.ts tone mapping helpers
  pages/
    login-page.tsx
    ops-page.tsx
    queue-page.tsx
    alerts-page.tsx
    cases-page.tsx
    case-detail-page.tsx
    reports-page.tsx
    search-page.tsx
    vehicles-page.tsx
    traffic-page.tsx
    zones-page.tsx
    events-page.tsx
    exports-page.tsx
    audit-page.tsx
    users-page.tsx
    settings-page.tsx
    not-found-page.tsx
  theme/
    strathmore.ts     semantic tokens + CSS variable application
    tokens.ts         current token export
    stratizen.ts      compatibility re-export alias
  types/
    domain.ts         shared domain contracts
server/
  index.js            Express API entry
  db.js               JSON-backed store and query helpers
  simulator.js        periodic alert ingestion
  data/
    seed.json         initial local data
    db.json           mutable runtime copy
    mock-events.ndjson simulator templates
config/
  package.json
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  eslint.config.js
  components.json
  .env.example
```

No Docker files are present in the repo as of March 1, 2026.

## Runtime boundaries

### Frontend

- Entry: `src/main.tsx`
- Theme variables are applied before React renders
- `AuthProvider` owns session state
- Router owns public/authenticated flows
- Pages fetch data through `api`

### Data boundary

- `src/api/index.ts` is the data-source seam
- Mock mode stays fully in-browser
- HTTP mode uses relative `/api` requests

### API client wrapper pattern

- `src/api/index.ts` exports a single `api` object
- `src/api/client.ts` provides the HTTP implementation
- `src/api/mock-client.ts` mirrors the same public methods against local datasets

The HTTP client currently adds:

- query-string building through `withQuery(...)`
- a shared `request<T>()` wrapper
- JSON request headers
- a 12-second abort timeout

Pages do not import `fetch` directly. They always call the `api` facade.

### Backend

- `server/index.js` exposes alert, case, search, audit, and health endpoints
- `server/db.js` reads/writes JSON on disk
- `server/simulator.js` appends alerts on an interval unless disabled

## High-level architecture diagram

```text
browser
  |
  v
src/main.tsx
  |
  v
AuthProvider
  |
  v
React Router
  |
  +--> /login -> LoginPage
  |
  +--> RequireAuth -> AppShell -> route pages
                        |
                        +--> api (mock-client or client)
                                  |
                                  +--> src/data/*          (default)
                                  |
                                  +--> /api via fetch      (optional)
                                            |
                                            v
                                       Express server
                                            |
                                            v
                                    server/data/db.json
```

## Folder responsibilities

| Area | Responsibility | Notes |
| --- | --- | --- |
| `src/app` | Route definitions and role metadata | Central place for route access and nav grouping |
| `src/pages` | Route-level composition | Pages orchestrate hooks and reusable components |
| `src/components/shared` | Reused presentational building blocks | Includes loading/error/filters/theme toggles |
| `src/components/ui` | Base primitives | Local wrappers, not a third-party runtime package |
| `src/data` | Placeholder datasets | Source of truth in mock mode |
| `src/lib` | Cross-cutting helpers | Auth, storage, formatting, compliance copy |
| `src/theme` | Tokens and variable application | CSS variables drive Tailwind colors |
| `server` | Optional local demo backend | Not required for static previews |

## Architectural observations

- The repo intentionally centralizes route access rules in one file: `src/app/access.tsx`.
- Data loading is lightweight and page-local. There is no global query cache.
- The shell itself makes data requests to decorate navigation badges.
- Local storage keys include a legacy `dama-sentinel.*` prefix for operator preferences and notes. This is current behavior, not a doc error.
