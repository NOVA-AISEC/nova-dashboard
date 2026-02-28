# NOVA Sentinel Dashboard

React, TypeScript, Tailwind v4, and shadcn-compatible UI for the NOVA Sentinel operations dashboard.

## Overview

This project implements an evidence-first security operations interface with:

- App shell with sidebar and topbar
- `/ops` operations overview
- `/alerts` alert review queue
- `/cases/:id` case workspace
- `/search` snapshot and metadata search
- Reusable components for alert review, evidence viewing, timelines, and filters

The UI is intentionally constrained to snapshots and metadata only.
Biometric identification, face matching, and identity inference are not part of the product surface.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn-compatible component patterns
- Lucide React
- React Router

## Project Structure

```text
src/
  app/              Router setup
  components/       Layout, shared, domain, and UI components
  data/             Mock dashboard data
  lib/              Utilities and formatters
  pages/            Route-level pages
  types/            Domain types
```

## Reusable Components

- `AlertTable`
- `EvidenceViewer`
- `CaseTimeline`
- `FiltersBar`

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Notes

- Routing is browser-based via `react-router-dom`.
- The current implementation uses mock data under `src/data/mock-data.ts`.
- Styling is tuned for a command-center layout with a dark sidebar and warm analytical workspace.
