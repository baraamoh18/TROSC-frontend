# TROSC frontend

React 19 + TypeScript + Vite + Tailwind v4 site for TROSC, deployed on Vercel
(<https://trosc.vercel.app>). It talks to the TROSC API under `/v1`.

## Develop

```bash
npm install
npm run dev            # proxies /v1 to a local backend on http://localhost:5000
npm run dev:prod-api   # proxies /v1 to the deployed API — reads/writes PRODUCTION data
```

To point the dev server somewhere else, set `DEV_API_TARGET` in `.env.local`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

## Deployment

Pushing to `main` deploys to Vercel. `vercel.json` rewrites `/v1/*` to the
backend and everything else to `index.html` (client-side routing).

## Layout

- `src/services/api.ts` — every API call and response type
- `src/context/` — auth state (`AuthProvider`, `useAuth`) and session-expiry handling
- `src/pages/` — route components (signed-in pages are lazy-loaded in `App.tsx`)
- `src/components/` — shared UI (`Modal`, `FeedbackPanel`, forms, track sections, admin panels)
- `src/sections/` — landing-page sections
- `assets/` — images imported by components; `public/` — favicon and social preview image
