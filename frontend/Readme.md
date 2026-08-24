# Ajali!

**See it. Report it. Respond to it.**

Ajali! is a React frontend for community emergency reporting in Kenya. Citizens submit incident reports with location and evidence. Administrators review, verify, start response, and resolve those reports.

This app is the Sprint 1 / frontend deliverable. Incident data lives in a local mock API so the UI can be swapped onto Flask later. Live public data (Kenyan place search and on-site weather) comes from Open-Meteo using `fetch`.

---

## Description

Emergencies are often reported by phone or walk-in, so location, photos, and status get lost. Ajali! gives citizens a simple report form and gives admins one operations panel.

**Audience:** Kenyan citizens and emergency operations admins.

**What you can do**

- Create an account and sign in (citizen or admin)
- Report an incident with type, description, map pin, and photos
- Search real Kenyan places and see live weather at the pin
- Track report status
- View community incidents on a map
- Admin: dashboard, inbox, review, lifecycle, notes, media, notifications, audit log

**Incident lifecycle**

```text
PENDING → VERIFIED → IN_PROGRESS → RESOLVED
PENDING → CLOSED
```

---

## Tech stack

- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Redux Toolkit + React Router
- MapLibre GL
- Open-Meteo (live geocoding and weather)
- Vitest + Testing Library
- PWA (installable)

---

## Installation

You need **Node.js 20+** and npm.

```bash
git clone <your-repo-url>
cd ajalihq/frontend
npm install
```

### Environment

The app reads `frontend/.env`. Copy the example if you do not have one yet:

```bash
cp .env.example .env
```

Required variables (already in `.env` and `.env.example`):

```env
VITE_GEOCODE_API_BASE=https://geocoding-api.open-meteo.com
VITE_WEATHER_API_BASE=https://api.open-meteo.com
```

These are public HTTPS hosts, not secrets. The app allow-lists those hostnames and ignores any other value. Do not commit a file that later contains keys.

---

## Run (development)

From `frontend/`:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

---

## Run (production build)

From `frontend/`:

```bash
npm run build
npm run preview
```

`build` type-checks and outputs static files to `frontend/dist`.
`preview` serves that production bundle locally.

Vite bakes `VITE_*` values from `.env` into the build. Restart `dev` or rebuild after changing `.env`.

---

## Tests

The frontend uses Vitest and Testing Library. Tests live next to the code they cover (`src/**/*.test.ts` / `.tsx`).

From `frontend/`:

```bash
npm run test           # watch mode
npm run test:run       # single CI-style run
npm run test:ui        # Vitest UI in the browser
npm run test:coverage
```

`test:ui` opens the Vitest dashboard (usually `http://localhost:51204/__vitest__/`). Use it to rerun files, inspect failures, and watch tests live.

The suite covers public HTTP allow-list rules, Open-Meteo query sanitization, incident lifecycle transitions, RBAC, Kenyan place fallbacks, ID validation, and the app error boundary.

---

## Demo accounts

Sprint 1 auth matches email to a seed user. Any non-empty password is accepted.

| Role | Email |
| --- | --- |
| Citizen | `amina@ajalihq.test` |
| Admin | `brian@ajalihq.test` |

Password: `password`

---

## Useful routes

| Path | Page |
| --- | --- |
| `/` | App landing |
| `/home` | Marketing site (about, how it works, terms) |
| `/signup` `/signin` | Auth |
| `/incidents/new` | Report an incident |
| `/incidents` | Citizen reports |
| `/map` | Community map |
| `/admin` | Admin dashboard |
| `/ppt` | Class presentation |
| `/privacy` `/terms` | Legal pages |

---

## Architecture

```text
UI (pages / components)
        │
        ├── Redux / hooks
        │
        ├── incidentApi / mediaApi / auth  →  src/data/api.ts (mock)
        └── geocodeApi / weatherApi        →  Open-Meteo (live fetch)
```

Incidents, users, notes, media, notifications, and audit stay in the mock service layer. Open-Meteo only receives a sanitized place name or rounded coordinates. See `docs/external-api.md` for the security rules.

---

## Rubric coverage

| Requirement | Where it is |
| --- | --- |
| Structured React app | `src/App.tsx`, pages, components, services |
| Async with fetch | `src/lib/public-http.ts`, Open-Meteo services |
| Loading and errors | Page states, toasts, `AppErrorBoundary` in `src/main.tsx` |
| Accessible navigation | Citizen shell, admin shell, marketing nav, labeled forms |
| Reusable components | Shared forms, media panel, conditions card |
| Live public API | Open-Meteo place search and weather |
| README | This file: title, description, install, run |
| Walkthrough | `docs/walkthrough.md` and `/ppt` |
| Self-assessment | `docs/self-assessment.md` |

---

## Project docs

- `docs/external-api.md` — Open-Meteo usage and security
- `docs/walkthrough.md` — instructor demo script
- `docs/self-assessment.md` — decisions and gaps

---

## Team

Nina Adora · Elias Cheruiyot · James Githinji · Purity Mutheu

Moringa School capstone. Frontend Sprint 1.
