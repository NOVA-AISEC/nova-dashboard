# Routing and Layout

## Entry and routing flow

```text
main.tsx
  -> applyStrathmoreTheme(getStoredThemeMode())
  -> render <App />

App.tsx
  -> <AuthProvider>
       <RouterProvider router={router} />

router.tsx
  -> PublicOnlyRoute
       /login
  -> RequireAuth
       /
         -> AppShell
              -> nested route pages
```

## Route map

| Route | Guard | Role access | Screen |
| --- | --- | --- | --- |
| `/login` | `PublicOnlyRoute` | Public only | Login page |
| `/` | `RequireAuth` | Authenticated | Redirects to `/ops` inside shell |
| `/ops` | `RequireRole` | `guard`, `analyst`, `supervisor`, `admin` | Ops Command |
| `/queue` | `RequireRole` | `guard`, `supervisor`, `admin` | Live Queue |
| `/alerts` | `RequireRole` | `guard`, `analyst`, `supervisor`, `admin` | Alerts |
| `/cases` | `RequireRole` | `analyst`, `supervisor`, `admin` | Cases list |
| `/cases/:id` | `RequireRole` | `analyst`, `supervisor`, `admin` | Case detail |
| `/reports` | `RequireRole` | `guard`, `supervisor`, `admin` | Reports |
| `/vehicles` | `RequireRole` | `analyst`, `supervisor`, `admin` | Vehicles |
| `/traffic` | `RequireRole` | `supervisor`, `admin` | Parking / Traffic |
| `/zones` | `RequireRole` | `supervisor`, `admin` | Zones & Cameras |
| `/events` | `RequireRole` | `supervisor`, `admin` | Events |
| `/exports` | `RequireRole` | `supervisor`, `admin` | Evidence Exports |
| `/audit` | `RequireRole` | `analyst`, `supervisor`, `admin` | Audit Log |
| `/users` | `RequireRole` | `admin` | Users & Roles |
| `/settings` | `RequireRole` | `supervisor`, `admin` | Preferences |
| `/search` | `RequireRole` | `analyst`, `supervisor`, `admin` | Snapshot Search |
| `*` | inside shell | Authenticated | Not Found |

## Redirect behavior

### Unauthenticated access

`RequireAuth` redirects to `/login` and stores the attempted path in router state:

```text
state = { from: location.pathname }
```

### Logged-in user opening `/login`

`PublicOnlyRoute` redirects away from `/login` to:

1. `location.state.from` if present
2. otherwise `getDefaultRoute(session.role)`

### Role mismatch

`RequireRole` redirects to the role's default allowed route.

## Default route logic

`getDefaultRoute(role)` scans `routeAccess` in declaration order and returns the first route the role can use:

- `guard` -> `/ops`
- `analyst` -> `/ops`
- `supervisor` -> `/ops`
- `admin` -> `/ops`

Because `ops` is the first allowed route for every role, all current roles land there by default unless a `from` route exists.

## Shell structure

All authenticated routes render inside `AppShell`.

```text
AppShell
  |- mobile overlay(s)
  |- left sidebar
  |    |- NOVA logo / brand copy
  |    |- grouped navigation
  |    |- compliance guardrail panel
  |    `- session summary + logout
  |- sticky top header
  |    |- mobile menu toggle
  |    |- brand lockup
  |    |- role badge
  |    |- settings shortcut (if allowed)
  |    |- snapshot search shortcut (if allowed)
  |    |- theme toggle
  |    `- user menu / logout
  `- main content
       |- nested route page via <Outlet />
       `- shared footer
```

## Navigation behavior

Navigation items are defined in `src/app/access.tsx` and filtered by role through `getAllowedNavigation(role)`.

Nav badges are computed in the shell from:

- `api.search('')`
- `api.listAudit({ page: 1, pageSize: 25 })`

Those results drive queue counts, critical alerts, case counts, vehicle evidence counts, pending exports, and audit totals.

## Module layout patterns

### Ops Command

- `PageHeader`
- metrics row
- campus context + guardrails
- alert table + active cases + shift notes
- zone summary and bottleneck explanation panels

### Live Queue

- `PageHeader`
- metrics row
- alert table
- dispatch board
- incident desk watch cards

### Alerts

- `PageHeader`
- metrics row
- `FiltersBar`
- `AlertTable` with acknowledge action

### Cases

List view:

- `PageHeader`
- card grid of cases

Detail view:

- `PageHeader`
- metrics row
- overview card + `CaseTimeline`
- `EvidenceViewer`
- linked `AlertTable`

## Route handles

Each shell route includes a `handle` with `eyebrow` and `title`, but the current `AppShell` does not consume those handles. Page-level titles are rendered directly inside each page component.
