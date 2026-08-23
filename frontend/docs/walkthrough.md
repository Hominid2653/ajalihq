# Live walkthrough (frontend)

Use this script for instructors. The app demo is also available at `/ppt`.

## Setup

1. `cd frontend`
2. `npm install`
3. Confirm `frontend/.env` exists (Open-Meteo hosts). Copy `.env.example` if needed.
4. `npm run dev` for local work, or `npm run build` then `npm run preview` for the production bundle
5. Open the printed local URL

## Citizen path

1. Open `/signup` or `/signin`.
2. Go to Report (`/incidents/new`).
3. In Search place, type a Kenyan town that is not in the short seed list (for example `Thika` or `Nyeri`).
4. Confirm live results appear, then pick one. The map pin updates.
5. Confirm **On-site conditions** loads temperature, wind, and rain.
6. Add a title, description, and optional photo. Submit.
7. Open the new report. Conditions still load from the saved coordinates.

## Admin path

1. Sign in as an admin seed user.
2. Open `/admin/incidents` and review a report.
3. On the detail page, confirm location plus live conditions.
4. Verify or start response. Dashboard, audit, and notifications still come from the mock API.

## What is live vs mock

- Live: Open-Meteo place search and weather (`fetch`)
- Mock: accounts, incidents, media, lifecycle, notifications, audit

If Open-Meteo is blocked, place search falls back to saved Kenyan labels and weather shows an unavailable message. Reporting still works.
