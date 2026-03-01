# Deploy Preview

## Goal

Provide a safe stakeholder preview of the current dashboard without implying real CCTV or production auth behavior.

## Recommended preview mode

Use a static frontend deployment with mock data enabled.

```dotenv
VITE_USE_MOCK=true
```

This is the safest option because:

- the frontend works entirely in-browser
- no local Express API is required
- auth remains clearly local/demo only
- no mutable server filesystem is needed

## Vercel / Netlify guidance

### Supported in the repo today

- Static deployment of the built `dist/` output
- Build command: `npm run build`
- Publish directory: `dist`
- Build env: `VITE_USE_MOCK=true`

### Not implemented in the repo today

- Serverless `/api/*` handlers for Vercel or Netlify
- Production proxy/rewrite setup for API mode
- Hosted persistence for `server/data/db.json`

## Preview deployment checklist

1. Set `VITE_USE_MOCK=true` in preview environment variables.
2. Run `npm run build`.
3. Deploy the generated `dist/`.
4. Confirm `/login`, `/ops`, `/alerts`, `/cases`, and `/search` load correctly.
5. Confirm the README or deployment notes state that auth and data are mocked.

## What to tell stakeholders

- This is a minimum working dashboard
- Login is local/demo only
- Data is placeholder-backed
- Evidence is represented as still snapshots plus metadata only
- Biometrics and identity inference are intentionally disabled

## If API-backed previews are required later

The current repo would need additional work:

1. Deploy `server/index.js` on a writable Node host.
2. Expose `/api/*` to the built frontend.
3. Decide how mutable state should be persisted outside `server/data/db.json`.
4. Clarify whether simulator ingestion should run in preview environments.

That is outside the current documentation pass and not implemented here.
