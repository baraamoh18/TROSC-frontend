# HANDOFF — TROSC Frontend: Implementing Unused Backend Endpoints

## LIVE SMOKE TEST RESULTS (2026-09-17) — done on https://trosc-frontend.vercel.app

- Both feature commits pushed: `4da70e7` (5 features) and `f22e141` (live-data fixes).
- **Bug found & fixed live**: `GET /sessions/:id` OMITS `resources` entirely (while
  `GET /sessions/track/:id` returns `[]`) → `session.resources.length` crashed React to a
  black page. Fixed with optional chaining + truthful types (`f22e141`). Session viewer now
  renders: breadcrumb (fixed `/track/[object Object]` — tracks come back POPULATED),
  "recording not published" placeholder, level/duration/instructor/description.
- CourseDetailsPage renders live data correctly (stats, empty-syllabus state, instructor row).
- Settings: Profile save persists (bio/website verified via /users/me), password change works
  and session survives, Danger Zone two-step confirm → deactivate → logout → /signin, and
  login afterwards is blocked ("Your account has been deactivated").
- Instructor route: student sees "Restricted area"; navbar icon hidden for students.
- Course enroll correctly errors for pending track students: "You must be enrolled in the
  parent track" (backend rule; happy path needs instructor approval, untestable without creds).
- NOT live-testable (no data/creds): RSVP toggle (only event is past — date-gating verified:
  no button renders), session ProgressToggle (myProgress only for approved students),
  instructor approve/reject queues (needs instructor/admin login — mock-tested previously).

## BACKEND ISSUES FOUND (report to backend owner, NOT frontend bugs)

1. **Signup takes >2 minutes** → Vercel proxy 502s (ROUTER_EXTERNAL_TARGET_ERROR) at ~100s.
   The request DOES complete server-side (user created) but the browser shows an error.
   Likely a blocking email/external call in the signup handler. Needs fixing server-side.
2. `GET /sessions/:id` omits `resources` (schema default not applied) — inconsistent with
   the by-track endpoint; frontend now guards for it, but backend should be consistent.
3. `deleteMe` does not remove the user from `track.pendingStudents` — a stale pending
   request from the deleted test account (id `6aac2808718eb7d11106d954`) remains on track
   `6a3965b9f9dc5aeadd4cdd4f`; instructor can just reject it.

## Goal

Implement the 5 features described in `D:\Work\TROSC\implementation_plan 9-17.md` in the
React frontend at `D:\Work\TROSC\TROSC-SCU.github.io`, matching the existing design style
(Poppins font, red primary + grey neutral palette from the user's image, defined in
`src/index.css` `@theme`).

The 5 features:
1. **Settings page** (updateMe / updateMyPassword / deleteMe)
2. **Event RSVP system** (rsvpEvent / cancelRsvp / getMyEvents)
3. **Session viewer + progress tracking** (getSession / markSessionWatched)
4. **Instructor/Admin dashboard** (getTrackPending / approveEnrollment / rejectEnrollment / getTrackLeaves / approveLeave / rejectLeave)
5. **Standalone course details page** (getCourse / enrollInCourse / leaveCourse)

Backend API docs: https://trosc.onrender.com/api-docs (Swagger UI).

## Current Progress — IMPLEMENTATION IS COMPLETE ✅

All 5 features are implemented, `npm run build` passes (tsc + vite, zero errors), and
`npm run lint` is clean. **Changes are NOT committed to git yet.**

### Files created

| File | Purpose |
|---|---|
| `src/pages/SettingsPage.tsx` | Tabbed settings page (Profile / Security / Danger Zone pills), style matches DashboardPage |
| `src/components/Settings/ProfileForm.tsx` | react-hook-form; name, bio, website, twitter/linkedin/github → `api.updateMe()`; uses RHF `values` option to prefill from user |
| `src/components/Settings/SecurityForm.tsx` | passwordCurrent/password/passwordConfirm → `api.updateMyPassword()`; reuses `PasswordInput` component |
| `src/components/Settings/DangerZone.tsx` | Two-step confirm → `api.deleteMe()` (soft delete) → `logout()` → navigate `/` |
| `src/pages/SessionViewerPage.tsx` | `/sessions/:sessionId`; renders `embedUrl` iframe (aspect-video), fallback external-link card, or "not published" placeholder; level badge, duration, date, instructor, description, resources list; 403 → "locked" state, 404 → "not found" |
| `src/components/Session/ProgressToggle.tsx` | Calls `api.markSessionWatched()`; once watched renders green "Watched" (backend has no unwatch) |
| `src/pages/CourseDetailsPage.tsx` | `/courses/:courseId`; hero card w/ gradient fallback, stats row (sessions/duration/enrolled/topics), overview, syllabus list, materials links, enroll/leave CTA with two-step leave confirm, instructor row; handles guest 401 ("Sign in to view") and 403 ("locked") |
| `src/pages/InstructorDashboardPage.tsx` | `/instructor`; role-gated (instructor/admin, else "Restricted area"); fetches `getTracks("limit=100&sort=-createdAt")` then filters client-side by `instructor._id === user._id` (admins see all); track pill selector with pending-count badges; two PendingApprovals tables; approve/reject handlers with busy-state + toast + refetch |
| `src/components/Instructor/PendingApprovals.tsx` | Reusable pending-people table (avatar, name, email, Approve=emerald-600, Reject=primary-dark buttons); used for both enrollment and leave queues |
| `src/components/RsvpButton.tsx` | Shared RSVP/Cancel-RSVP toggle; syncs state from `event.attendees` + `user._id`; 401 → "Sign in to RSVP" toast |

### Files modified

| File | Change |
|---|---|
| `src/App.tsx` | Added routes: `/courses/:courseId` (MainLayout, public), `/settings`, `/sessions/:sessionId`, `/instructor` (MainLayoutNoFooter + ProtectedRoute) |
| `src/components/Navbar.tsx` | Desktop: GraduationCap icon → `/instructor` (only if role instructor/admin), Settings gear icon → `/settings`, before existing name+logout. Mobile menu: "Instructor Dashboard" + "Settings" rows |
| `src/components/TrackDetails/TrackSessionsTable.tsx` | "View session" external anchor → internal `Link` to `/sessions/:id` ("Watch session", PlayCircle icon); session title is now also a Link when canWatch |
| `src/components/TrackDetails/TrackCourses.tsx` | CourseCard is now a `Link` to `/courses/:id` (hover ring + title color); syllabus accordion button calls `preventDefault()` + `stopPropagation()` so it doesn't navigate |
| `src/sections/UpComingEvents.tsx` | Extracted inline RSVP logic → uses shared `RsvpButton` (label changed "Enroll Now" → "RSVP Now") |
| `src/sections/Events.tsx` | EventCard now shows `<RsvpButton>` next to "See More" **only when event date is in the future** |

### Pre-existing (already done before this session — verified, no work needed)

- `src/services/api.ts` already had ALL endpoint wrappers from the plan.
- DashboardPage already fetches `getMyEvents()` for "My Events" section and has avatar upload via `updateMe`.
- UpcomingEventCard already had RSVP toggle (now refactored into shared RsvpButton).

## What Worked

- **Swagger spec extraction**: `/api-docs-json` does NOT exist. The spec is embedded in
  `https://trosc.onrender.com/api-docs/swagger-ui-init.js` as `options.swaggerDoc` (a JS
  object literal spanning file lines ~11–9765). It was extracted with a brace-matching
  Node script handling string escapes; result: 85 paths. All plan endpoints verified,
  including response shapes (e.g. `/tracks/{id}/pending` returns BOTH `pendingStudents`
  AND `pendingLeaves` in one `PendingListResponse`).
- **Design conventions discovered** (reuse these): page wrapper
  `min-h-screen bg-neutral-light pt-24 pb-20 font-family-poppins`; cards
  `rounded-2xl bg-white p-6 shadow-sm` / `border border-neutral-light-active`; headings
  `text-2xl font-extrabold text-primary-darker`; inputs
  `px-4 py-3 border-2 border-neutral-light-active rounded-full bg-neutral-light ... focus:border-primary`;
  primary button `bg-primary hover:bg-primary-hover text-white font-bold rounded-full`;
  empty states `border-dashed border-neutral-light-active`; react-hook-form like
  `SignInForm.tsx`; `PasswordInput` forwards ref for RHF.
- Build/lint loop: fixed one TS error (type predicate on possibly-null stats array in
  CourseDetailsPage) by restructuring into an IIFE returning explicitly-typed array;
  used `import type { LucideIcon } from "lucide-react"`.

## What Didn't Work (do NOT repeat)

- **Live-backend smoke test is blocked by CORS, full stop.** The deployed Render backend
  runs NODE_ENV=production, so its CORS whitelist (`src/app.js` of the backend,
  `allowedOrigins`) contains NO localhost origins — only `FRONTEND_URL`/`EXTRA_CORS_ORIGINS`
  env values, and `https://trosc-scu.github.io` is NOT whitelisted either (probed with curl,
  got 403). The rejection happens in the backend's own cors middleware, which returns
  403 JSON `Origin <origin> not allowed by CORS`; the frontend surfaces that as the toast.
  This affects BOTH direct fetches and requests through the Vite proxy (proxy forwards the
  Origin header). Tested from `http://localhost:5174` (my dev server) and
  `http://localhost:5173` (user's already-running dev server) — both 403. The test signup
  was never created (preflight rejected).
- **Local backend** at `D:\Work\TROSC\trosc-backend-main` is not runnable as-is: no
  `node_modules`, only `.env.example` (no Mongo URI / JWT secrets).
- **In-app browser `tab.goto()`** to SPA routes timed out once (10s); client-side
  navigation (click a real link, or `history.pushState` + `popstate` dispatch via
  `playwright.evaluate`) works fine.
- Port 5173 is taken by the user's own dev server; my `npm run dev` landed on 5174
  (background task id `exec_6ec05801-3872-4559-aa19-63580af6b6c9` — still running,
  log at `C:\Users\albar\.zcode\cli\exec\sess_21ffbc5a-2280-4d5c-83d5-12e23bceb60f\call_d741b83cb5784c30bb239b55-stdout.log`).

## Next Steps

### 1. Smoke-test the new pages with a local mock API (recommended path)

Since the live backend blocks localhost, verify the authenticated UI against a tiny mock:

1. Write a mock API server (plain Node, no deps) on **port 9999** with permissive CORS
   (`Access-Control-Allow-Origin: <echo origin>`, `Access-Control-Allow-Credentials: true`,
   handle OPTIONS preflight; ignore cookies — auth is fake). In-memory data:
   - instructor user `{ _id: "u1", name, email, role: "instructor", enrolledTrack: "t1", enrolledCourses: ["c1"] }`
   - track `t1` (instructor = u1, pendingStudents: 2 fake users, pendingLeaves: 1)
   - session `s1` (tracks: ["t1"], embedUrl: `https://www.youtube.com/embed/dQw4w9WgXcQ`,
     url, myProgress `{status:"not_started"}`, resources: 1 item, level, duration, startDate)
   - course `c1` (track t1, syllabus 3 items, sessionCount/duration/studentCount, instructor u1)
   - event `e1` (future date, attendees: [])
   - enrollments `{ tracks:[t1], courses:[c1], sessions:[s1] }`; a few activity logs
2. Endpoints needed (all under `/v1`): `GET users/me`, `PATCH users/updateMe`,
   `PATCH users/updateMyPassword`, `DELETE users/deleteMe`, `GET users/me/enrollments`,
   `GET events/my-events`, `GET activity-logs/me?limit=10`, `GET sessions/:id`,
   `PUT sessions/:id/progress`, `GET courses/:id`, `POST courses/:id/enroll-me`,
   `DELETE courses/:id/leave-me`, `GET tracks?limit=100&sort=-createdAt`,
   `GET tracks/:id/pending`, `POST tracks/:id/students/:sid/approve|reject`,
   `POST tracks/:id/leaves/:sid/approve|reject`. Response shapes: mirror
   `src/services/api.ts` types (e.g. list responses are `{status, results?, total?, data: {...}}`).
3. Build + preview WITHOUT touching shared files (inline env var only affects that build;
   do NOT create .env files — Vite watches them and would restart the user's 5173 server):
   ```bash
   cd "D:\Work\TROSC\TROSC-SCU.github.io"
   VITE_API_URL=http://localhost:9999 npm run build
   npm run preview -- --port 5199
   ```
4. Browser-verify (in-app browser works; bootstrap via the `browser-use:control-browser`
   skill): `/settings` (all 3 tabs; save profile keeps new name), `/dashboard`,
   `/instructor` (approve/reject moves rows), `/courses/c1` (enroll→leave round trip),
   `/sessions/s1` (iframe renders, Mark as watched flips state), and from
   `/track/t1` the sessions table "Watch session" navigates to the viewer.
5. **Clean up**: kill mock server + preview; run plain `npm run build` to restore a
   pristine `dist` (dist is gitignored, so this is just hygiene); delete mock file if
   written into the repo (prefer writing it to `%TEMP%` / outside the repo).
6. Kill my background dev server on 5174 (or leave it; it's harmless).

### 2. Report to user / commit

- Changes are uncommitted. Suggested commit message: `feat: settings page, session viewer, course details, instructor dashboard, shared RSVP button`.
- Do NOT push without asking; the user decides.
- Note for the user: to dev against the live backend they need the backend's CORS to
  whitelist `http://localhost:5173` (set `FRONTEND_URL` or `EXTRA_CORS_ORIGINS` in the
  Render env), otherwise every API call from localhost fails with 403 "Origin not allowed by CORS".

### 3. Optional polish (not required)

- CourseDetailsPage: add course reviews (endpoints `getCourseReviews`/`submitCourseReview`
  exist in api.ts; `TrackFeedback.tsx` is the pattern to copy).
- `GET /sessions` and `GET /tracks` have no instructor/course query filters (verified in
  swagger) — client-side filtering in InstructorDashboardPage is intentional.

## Environment Notes

- Project: `D:\Work\TROSC\TROSC-SCU.github.io` (React 19 + Vite 7 + Tailwind v4 +
  react-router-dom 7 + react-hook-form + react-hot-toast + lucide-react; TypeScript ~5.9).
- Backend repo (reference only): `D:\Work\TROSC\trosc-backend-main` (Express, CORS
  whitelist in `src/app.js` lines ~88–141).
- Plan doc: `D:\Work\TROSC\implementation_plan 9-17.md`. Related analysis docs in the
  same folder (`backend_gaps_report.md`, `frontend_backend_gap_analysis.md`).
- In-app browser has 2 leftover tabs (`localhost:5174/signup`, `localhost:5173/signup`) —
  close or reuse them.
