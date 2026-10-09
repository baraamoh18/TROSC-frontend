<div align="center">

<img src="assets/TroscLogoRed.webp" alt="TROSC logo" width="120" />

# TROSC Frontend

**The learning platform of TROSC, the student-led tech team at the Faculty of Computers and Information, Suez Canal University.**

[Live site](https://trosc.vercel.app) · [Explore tracks](https://trosc.vercel.app/explore) · [Contact](https://trosc.vercel.app/contact)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Radix-000000?logo=shadcnui&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## Overview

TROSC runs learning tracks: groups of courses with live sessions, weekly tasks and reviewed assignments. This repository holds the web client for those tracks. It's a single-page React app deployed on Vercel. It talks to the TROSC REST API under `/v1`, which is a separate service hosted on Render.

**For visitors**
- Browse tracks, courses and upcoming events on the landing page and `/explore`
- Read track and course details, the FAQ (English and Arabic), and the contact, privacy and terms pages

**For students** (signed in)
- Join tracks, watch sessions and mark progress
- Submit weekly tasks and assignments and read feedback
- RSVP to events, and manage profile, avatar, appearance and security from Settings

**For instructors and admins**
- Create and edit tracks, courses, sessions, weekly tasks and assignments in the **Studio**
- Grade submissions and approve pending requests
- View platform stats and trends, and manage users and roles (admin only)

The client is a single-page app, so most URLs would return the same empty HTML shell. To fix that for search engines and crawlers that don't run JavaScript, an edge middleware sends public pages to a serverless function. It returns a real `<head>` and readable page text, then the SPA boots normally. The same function serves `/sitemap.xml`.

## Tech Stack

| Area | Tools |
| --- | --- |
| UI framework | [React 19](https://react.dev) with [TypeScript 5.9](https://www.typescriptlang.org) |
| Build and dev server | [Vite 7](https://vite.dev) with `@vitejs/plugin-react` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`, plus `tw-animate-css` |
| Components | [shadcn/ui](https://ui.shadcn.com) (new-york style) on [Radix UI](https://www.radix-ui.com), `cmdk`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Icons | [Lucide](https://lucide.dev) (`lucide-react`) |
| Routing | [React Router 7](https://reactrouter.com) with lazy-loaded signed-in pages |
| Forms and dates | `react-hook-form`, `react-day-picker`, `date-fns` |
| Notifications | `react-hot-toast` |
| Image uploads | [Cloudinary](https://cloudinary.com) with unsigned upload presets, resized and re-encoded in the browser before upload |
| Hosting and edge | [Vercel](https://vercel.com) with `@vercel/functions` (middleware and a serverless SEO function) |
| Linting | ESLint 9 (flat config), `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` |
| Backend | TROSC REST API (separate repository), hosted at `https://trosc.onrender.com` |

## Project Structure

```text
TROSC-SCU.github.io/
├── api/
│   └── seo.ts                  # Vercel function: server-rendered <head> and text for public pages, plus /sitemap.xml
├── assets/                     # Logos and illustrations imported by components
├── public/                     # Served as-is: favicons, Open Graph image, robots.txt
├── src/
│   ├── main.tsx                # App entry point
│   ├── App.tsx                 # Route table: public, signed-in (protected) and auth routes
│   ├── index.css               # Tailwind v4 entry, theme tokens and global styles
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (button, dialog, popover, calendar, command…)
│   │   ├── Admin/              # Platform stats, trends chart, user management, content management
│   │   ├── Studio/             # Instructor and admin authoring: courses, sessions, tasks, grading, requests
│   │   ├── TrackDetails/       # Track page: hero, tabs, courses, sessions table, tasks, assignments
│   │   ├── Settings/           # Profile, avatar, appearance, security, my events, danger zone
│   │   ├── Dashboard/          # Student dashboard widgets
│   │   ├── Instructor/         # Pending approvals
│   │   ├── Session/            # Session progress toggle
│   │   ├── ThemeToggle/        # Light and dark theme switch
│   │   └── *.tsx               # Shared UI: Navbar, Footer, Modal, forms, ProtectedRoute, ErrorBoundary…
│   ├── content/
│   │   └── faq.json            # FAQ in English and Arabic, shared by the home page and api/seo.ts
│   ├── context/                # AuthProvider, useAuth and session-expiry handling
│   ├── data/                   # Static track data
│   ├── hooks/                  # Page title, reduced motion, scroll-to-hash, staff users
│   ├── layout/                 # Main, main-without-footer and auth layouts
│   ├── lib/utils.ts            # cn() class-name helper used by shadcn/ui
│   ├── pages/                  # One component per route (landing, explore, track, course, studio…)
│   ├── sections/               # Landing-page sections: hero, tracks, events, how it works, FAQ…
│   ├── services/api.ts         # Every API call and response type, with 401 → session-expiry hook
│   └── utils/                  # Image upload, theme, motion, redirects, trusted hosts, catalog helpers
├── middleware.ts               # Vercel edge middleware: sends public routes to api/seo.ts
├── vercel.json                 # Rewrites: /v1 → backend, /sitemap.xml → api/seo, everything else → SPA
├── vite.config.ts              # Plugins, @ alias, dev proxy for /v1, build step that emits faq.json
├── components.json             # shadcn/ui generator config
├── eslint.config.js            # ESLint flat config
├── tsconfig.json               # Project references
├── tsconfig.app.json           # Browser code (src/)
├── tsconfig.node.json          # Tooling (vite.config.ts)
├── tsconfig.server.json        # Vercel code (api/, middleware.ts)
├── .env.prod-api               # Dev-only proxy settings that point at the production API
└── RBAC-AND-DRIVE-UPLOAD.md    # Backend contract for access levels and private Drive submissions
```

## Getting Started

### Prerequisites

- **Node.js** 20.19+ or 22.12+ (Vite 7 requires one of these; the project is developed on Node 24)
- **npm** (the repository ships a `package-lock.json`)
- **A running TROSC API** for local development. By default the dev server proxies `/v1` to `http://localhost:5000`. If you don't run the backend locally, see [Using the production API](#using-the-production-api).

Check your versions:

```bash
node --version
npm --version
```

### Installation

```bash
git clone https://github.com/baraamoh18/TROSC-frontend.git
cd TROSC-frontend
npm ci
```

### Local development

Start the TROSC API on port `5000`, then run:

```bash
npm run dev
```

Vite serves the app at <http://localhost:5173>. Requests to `/v1/*` are proxied to `http://localhost:5000`, and cookies are rewritten to `localhost` so sign-in works.

To proxy to a backend on a different address, create `.env.local` (git ignores it):

```dotenv
DEV_API_TARGET=http://localhost:8080
```

#### Using the production API

> [!WARNING]
> This mode reads and writes the **production database**. Anything you create, edit or delete is real.

```bash
npm run dev:prod-api
```

This loads `.env.prod-api`. It proxies `/v1` to `https://trosc.onrender.com` and sends `https://trosc.vercel.app` as the request `Origin`, because the API's CORS check rejects writes from `http://localhost`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server, proxying `/v1` to a local backend |
| `npm run dev:prod-api` | Start the dev server against the production API |
| `npm run build` | Type-check every project (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | Run ESLint over the repository |

### Building

```bash
npm run build
npm run preview
```

`npm run build` fails on any type error in `src/`, `api/`, `middleware.ts` or the Vite config. The build also copies `src/content/faq.json` to `dist/faq.json`, which `api/seo.ts` fetches to render the FAQ.

`npm run preview` serves only the static build. The `/v1` rewrite, the edge middleware and `api/seo.ts` run on Vercel only. To exercise them locally, use the Vercel CLI:

```bash
npx vercel dev
```

### Deployment

The site deploys to **Vercel**, and every push to `main` triggers a production deployment.

```bash
git push origin main
```

Vercel detects the Vite framework preset: it runs `npm run build` and serves `dist/`. At runtime:

1. **`middleware.ts`** catches the public routes `/`, `/explore`, `/contact`, `/privacy`, `/terms`, `/track/:id`, `/courses/:id` and `/events/:id`, and rewrites them to `/api/seo?path=<path>`.
2. **`api/seo.ts`** fetches the page's data from the API, then returns the SPA shell with a page-specific title, description, Open Graph tags, structured data and readable text. Vercel's CDN caches the response.
3. **`vercel.json`** rewrites `/v1/*` to `https://trosc.onrender.com/v1/*`, `/sitemap.xml` to `/api/seo?sitemap`, and every other non-asset path to `index.html` for client-side routing.

Because the browser calls the API through `/v1` on its own origin, auth cookies are first-party and no CORS setup is needed in production.

## Configuration

The project runs without any environment file. Each variable has a working default, so set one only to change that behaviour.

### Dev server (`vite.config.ts`)

Read from `.env.local`, `.env.[mode].local` or `.env.prod-api`. Used only by `npm run dev` and `npm run dev:prod-api`, and never included in the bundle.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DEV_API_TARGET` | `http://localhost:5000` | Where the dev server proxies `/v1/*` requests |
| `DEV_API_ORIGIN` | *(not set)* | If set, replaces the `Origin` header on proxied requests so a remote API's CORS check accepts them |

### Client build (`import.meta.env`)

These are inlined into the JavaScript bundle at build time, so they are public. Set them in `.env.local` for development or in the Vercel project settings for deployments.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | *(not set)* | Absolute API origin, e.g. `https://api.example.com`. The client appends `/v1`. When unset, the client calls same-origin `/v1`, which the dev proxy or `vercel.json` forwards. |
| `VITE_CLOUDINARY_CLOUD_NAME` | `d8xhaxa9` | Cloudinary cloud that receives image uploads |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `trosc_images` | Unsigned upload preset; it limits format, size and folder on Cloudinary's side |

### Vercel function (`api/seo.ts`)

Set these in the Vercel project's environment variables.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SITE_URL` | `https://trosc.vercel.app` | Canonical site origin used in canonical links, Open Graph URLs and the sitemap |
| `API_URL` | `https://trosc.onrender.com/v1` | API base the function fetches tracks, courses and events from |

### Example `.env.local`

```dotenv
# Proxy /v1 to a backend on another port
DEV_API_TARGET=http://localhost:8080

# Upload images to your own Cloudinary account
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
```

> [!NOTE]
> Never put secrets in a `VITE_` variable. Vite inlines every `VITE_` value into the public bundle. The Cloudinary cloud name and unsigned preset are public by design.

## Related Documents

- [`RBAC-AND-DRIVE-UPLOAD.md`](RBAC-AND-DRIVE-UPLOAD.md): the backend contract this client expects. It covers guest, signed-in and enrolled access levels, and private Google Drive task submissions.
