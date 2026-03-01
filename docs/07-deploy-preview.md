# Deploy Preview

## Goal

Provide a safe stakeholder preview of the current dashboard without implying real CCTV or production auth behavior.

## Recommended preview mode

Deploy the app as a static Vite frontend with mock data enabled.

```dotenv
VITE_USE_MOCK=true
VITE_DEMO_PASSWORD=
```

This is the safest option because:

- the frontend works entirely in-browser
- no Express API is required at runtime
- auth remains clearly local/demo only
- mock data is the default unless `VITE_USE_MOCK=false`
- the optional demo password gate can limit casual access to the preview URL

## Build settings confirmed in this repo

- Framework: Vite + React + TypeScript
- Build command: `npm run build`
- Preview command: `npm run preview`
- Output directory: `dist` (Vite default, no custom `build.outDir` is set)
- Static preview mode: `VITE_USE_MOCK=true`

## Vercel configuration in this repo

The root `vercel.json` rewrites all non-file SPA requests to `/index.html`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

That ensures browser refreshes on deep links such as `/ops`, `/alerts`, and `/cases` do not return a Vercel 404. React Router handles the route after `index.html` loads.

## Environment variables

Set these in Vercel Project Settings -> Environment Variables:

- `VITE_USE_MOCK=true`
- `VITE_DEMO_PASSWORD=` optional, leave blank to disable the demo gate

Notes:

- Only variables prefixed with `VITE_` are exposed to the frontend build.
- If `VITE_USE_MOCK=false`, the frontend expects `/api/*` on the same origin. That is not part of this standalone demo deployment.
- If `VITE_DEMO_PASSWORD` is set to a non-empty value, the app shows a small unlock screen before the normal login/auth flow.
- The unlock state is stored in `sessionStorage` as `demo_unlocked`, so it resets when the tab closes.

## Deploy with the Vercel GUI

1. Push the repo to GitHub, GitLab, or Bitbucket.
2. In Vercel, click `Add New...` -> `Project`.
3. Under `Import Git Repository`, select this repo and click `Import`.
4. Confirm the detected framework is `Vite`.
5. Leave the root directory as the repo root unless you intentionally deploy from a subdirectory.
6. Confirm:
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Add environment variables:
   - `VITE_USE_MOCK=true`
   - `VITE_DEMO_PASSWORD=your-demo-password` only if you want the stakeholder gate
8. Deploy.
9. After deployment, open the preview URL and verify:
   - `/login` loads
   - `/ops` loads after login
   - `/alerts` loads after refresh
   - `/cases` loads after refresh

## Deploy with the Vercel CLI

1. Install the CLI:

   ```bash
   npm i -g vercel
   ```

2. From the repo root, link the project:

   ```bash
   vercel link
   ```

3. Add preview environment variables if they are not already configured:

   ```bash
   vercel env add VITE_USE_MOCK preview
   vercel env add VITE_DEMO_PASSWORD preview
   ```

4. Deploy a preview build:

   ```bash
   vercel
   ```

5. Deploy to production later if needed:

   ```bash
   vercel --prod
   ```

If you want local Vercel env values pulled into the repo for development, run:

```bash
vercel env pull
```

## Safe stakeholder sharing

- Prefer `VITE_USE_MOCK=true` for all preview/stakeholder deployments.
- Set `VITE_DEMO_PASSWORD` for any link that will be shared outside the core team.
- Share the preview URL and the password out-of-band.
- Tell stakeholders the preview uses local/demo auth and placeholder data only.
- Do not position the deployment as production auth or production CCTV behavior.

## What to tell stakeholders

- This is a minimum working dashboard
- Login is local/demo only
- Data is placeholder-backed
- Evidence is represented as still snapshots plus metadata only
- Biometrics and identity inference are intentionally disabled

## Not implemented in this standalone demo

- Serverless `/api/*` handlers for Vercel
- Production API hosting for `server/index.js`
- Hosted persistence for `server/data/db.json`
- Runtime backend dependencies for the preview link
