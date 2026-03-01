# NOVA Pencil Prototype

`design/design.pen` is the canonical Pencil document for the current frontend.

The file now contains:

- locked-reference route boards for the current 1440x900 captures
- editable UI rebuilt as Pencil shapes and reusable components above those captures
- a `COMPONENT LIBRARY` board with the shared symbols used by the five primary screens

## Open In Pencil

1. Open Pencil desktop.
2. Open [design.pen](/C:/Users/HP/Projects/nova-dashboard/design/design.pen).
3. Keep [assets](/C:/Users/HP/Projects/nova-dashboard/design/assets) beside the `.pen` file. The reference layer still uses those relative PNG fills.

## Board Structure

- `COMPONENT LIBRARY`
- `NOVA Frontend Capture / Light`
- `NOVA Frontend Capture / Dark`

Primary screen wrappers on the Light and Dark boards:

- `Login`
- `Ops`
- `Live Queue`
- `Alerts`
- `Cases`

Each viewport now contains two top-level groups:

- `REFERENCE (LOCKED)`: screenshot truth source from the implemented app
- `EDITABLE UI`: the real Pencil rebuild made from reusable components

Pencil MCP did not expose a schema-level `locked` property during automation, so `REFERENCE (LOCKED)` should be manually locked in the Pencil desktop UI after opening the file.

## Component Library

Reusable masters on `COMPONENT LIBRARY`:

- Layout
- `Component/AppShell`
- `Component/HeaderBar`
- `Component/SidebarItem/Default`
- `Component/SidebarItem/Active`
- `Component/SidebarItem/Hover`

- Primitives
- `Component/Button/Primary`
- `Component/Button/Secondary`
- `Component/Button/Ghost`
- `Component/Input/Default`
- `Component/Input/Focused`
- `Component/Input/Error`
- `Component/Select/Closed`
- `Component/Select/Open`
- `Component/Divider`
- `Component/Card`
- `Component/SectionHeading`
- `Component/Badge/Neutral`
- `Component/Badge/Compliance`
- `Component/Badge/Status/Normal`
- `Component/Badge/Status/Elevated`
- `Component/Badge/Status/Critical`
- `Component/Badge/SidebarNotification`

- Data display
- `Component/StatCard`
- `Component/FiltersBar`
- `Component/Table/Alert`
- `Component/EmptyState`
- `Component/CaseCard`

- Auth
- `Component/LoginFormBlock`
- `Component/MockAuthInfoHint`

- Screen masters
- `Component/Screen/Login`
- `Component/Screen/Ops`
- `Component/Screen/LiveQueue`
- `Component/Screen/Alerts`
- `Component/Screen/Cases`

Theme preview rows:

- `Preview / Light`
- `Preview / Dark`

These previews use the same reusable masters inside Light and Dark themed containers so changes can be checked without opening the route boards.

## Editing Workflow

To change a shared component:

1. Edit the reusable master on `COMPONENT LIBRARY`.
2. The `EDITABLE UI` instances on the screen boards will inherit that change.

To adjust a specific route without changing all screens:

1. Open the relevant route board.
2. Expand `Viewport /...`.
3. Edit only the `EDITABLE UI` instance overrides for that route.

To compare against the implemented UI:

1. Toggle visibility of `EDITABLE UI`.
2. Toggle visibility of `REFERENCE (LOCKED)`.
3. Lock `REFERENCE (LOCKED)` in Pencil desktop before doing manual edits.

## Route Mapping

- `/login` -> `Login / Light`, `Login / Dark`
- `/ops` -> `Ops / Light`, `Ops / Dark`
- `/queue` -> `Live Queue / Light`, `Live Queue / Dark`
- `/alerts` -> `Alerts / Light`, `Alerts / Dark`
- `/cases` -> `Cases / Light`, `Cases / Dark`

Implemented but not promoted as a primary board:

- `/cases/:id`

## Component Mapping

- `AppShell` maps to the authenticated route screens.
- `PageHeader` is rebuilt inside each screen master as editable text + action/button instances.
- `MetricCard` maps to `Component/StatCard` instances on `Ops`, `Live Queue`, and `Alerts`.
- `AlertTable` maps to `Component/Table/Alert` instances on `Live Queue` and `Alerts`, plus a custom ops-focused top viewport composition on `Ops`.
- `FiltersBar` maps to `Component/FiltersBar` on `Alerts`.
- `Cases` uses `Component/CaseCard` instances.
- `Login` uses `Component/LoginFormBlock` plus the rebuilt hero panel.

## Prototype Wiring

The canonical repo file preserves the screen structure, route annotations, and reusable component hierarchy needed for prototype wiring, but the export path available through Pencil MCP did not serialize link metadata into `design.pen`.

Use the route wrappers and annotations to wire interactions in Pencil desktop:

- sidebar items should target `/ops`, `/queue`, `/alerts`, and `/cases`
- the login submit action should target `/ops`

This still mirrors the mocked route behavior documented in the app: auth and theme state are stored in `localStorage`, and data remains mock-backed unless `VITE_USE_MOCK=false`.

## Tokens

The Pencil file mirrors the implemented frontend tokens from `src/index.css`, including:

- `Space Grotesk` for display type
- `IBM Plex Sans` for interface copy
- surface, sidebar, border, and text color variables
- the action gradient `#EC7D30 -> #F25B29`

The action gradient is intentionally used only where the frontend currently uses it.

## Manual Validation Checklist

Use Pencil desktop for final review:

- viewport size is `1440x900` for every route viewport
- `REFERENCE (LOCKED)` remains beneath `EDITABLE UI`
- sidebar width and header height align with the underlying reference image
- spacing between page header, stat cards, filters, and tables matches the screenshot
- display type uses `Space Grotesk` and body copy uses `IBM Plex Sans`
- the action gradient appears only on the same CTA elements as the frontend
- dark mode boards keep the same composition and switch the theme-sensitive colors only
- login light board toggle reads `DARK MODE`
- login dark board toggle reads `LIGHT MODE`

## Notes

- The reference screenshots remain part of the document and should not be removed.
- The editable layer should be treated as the maintainable source for future updates.
- If interactive links are needed in the desktop prototype, add them after opening the file because they were not serialized by the current MCP export path.
- Pencil MCP screenshot rendering was sufficient for spot checks, but final pixel review should still be done in the Pencil desktop app because local image fills can render inconsistently in automation.
