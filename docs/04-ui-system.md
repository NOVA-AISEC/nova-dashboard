# UI System

## Summary

The UI is a local component system built from:

- Tailwind CSS v4
- CSS custom properties applied at runtime
- shadcn-style local primitives in `src/components/ui`
- shared presentational components in `src/components/shared`

## Tokens and theming strategy

Theme state is applied before React mounts:

```text
main.tsx
  -> getStoredThemeMode()
  -> applyStrathmoreTheme(mode)
```

`src/theme/strathmore.ts` defines:

- brand colors
- semantic palette for light and dark
- CSS variable generation
- `nova-theme-mode` storage key
- helper functions for reading, writing, and applying theme mode

## Token layers

### Brand colors

- `blue`
- `gold`
- `red`
- `black`
- `white`
- `offwhite`

### Semantic colors

- `primaryDark`
- `primaryDeep`
- `accentBlue`
- `accentGlow`
- `surfaceLight`
- `surfaceMuted`
- `textPrimary`
- `textSecondary`
- `success`
- `warning`
- `danger`
- sidebar-specific colors

### Tailwind mapping

`tailwind.config.ts` maps Tailwind color names to CSS variables via `rgb(var(--...))`.

Examples:

- `bg-surface`
- `text-ink`
- `border-surfaceMuted/20`
- `text-textSecondary`

## Typography

Fonts are imported in `src/index.css`:

- Body: `IBM Plex Sans`
- Display/headings: `Space Grotesk`

## Spacing and composition

There is no separate spacing token file. Spacing is composed directly in Tailwind utility classes:

- page sections commonly use `space-y-6`
- cards commonly use `p-4`, `p-5`, `pt-5`
- shell content uses a centered `max-w-[1500px]`

## Dark/light mode

Theme switching uses:

- `useThemeMode()`
- `ThemeToggle`
- `window.localStorage`
- a custom `nova-theme-mode-change` browser event

Mode changes update CSS variables on `document.documentElement` and sync across tabs through the `storage` event.

## Component structure

### Base primitives

Located in `src/components/ui`:

- `button.tsx`
- `badge.tsx`
- `card.tsx`
- `input.tsx`
- `select.tsx`
- `textarea.tsx`
- `button-variants.ts`

These are local wrappers used throughout the app. They are the closest thing to a base design-system layer in the repo.

### Shared components

Located in `src/components/shared`:

- `PageHeader`
- `ThemeToggle`
- `MetricCard`
- `SeverityBadge`
- `ActionButton`
- `FiltersBar`
- `LoadingPanel`
- `ErrorPanel`
- `LiveIndicatorDot`
- `NovaLogo`
- accent helpers

### Feature components

- `src/components/ops/alert-table.tsx`
- `src/components/cases/evidence-viewer.tsx`
- `src/components/cases/case-timeline.tsx`
- `src/components/layout/app-shell.tsx`

## Placeholder states

The app uses simple explicit states instead of Suspense or a query library:

- `LoadingPanel` for initial async load skeletons
- `ErrorPanel` for failed loads
- inline empty messages inside feature components

Examples:

- `AlertTable` shows "No alerts match the current filter set."
- `EvidenceViewer` shows "No evidence linked to this case."
- `ReportsPage` shows "No manual reports yet."
- `SearchPage` shows "No snapshots matched."

## Visual rules enforced by implementation

- Action emphasis is centralized through the NOVA gradient helpers
- Compliance chips and notices are repeated across screens
- Evidence surfaces always restate "snapshots + metadata only"
- Biometrics-disabled language is hard-coded into multiple screens

## Notable implementation detail

`src/theme/tokens.ts` currently re-exports Strathmore tokens, and `src/theme/stratizen.ts` exists as a compatibility alias layer. That suggests the branding/token layer is intentionally still in transition, but the active theme implementation is Strathmore-based.
