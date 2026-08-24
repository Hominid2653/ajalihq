# Ajali!

**See it. Report it. Respond to it.**

Ajali! is a community emergency reporting platform for Kenya. This repository contains the React frontend (Sprint 1) and a Flask backend scaffold that is not wired yet.

The graded frontend lives in [`frontend/`](frontend/). Use that folder to install and run the app.

---

## Description

Citizens report accidents, fires, medical cases, crime, and disasters with a location pin and photos. Administrators review those reports, verify them, start a response, and resolve them. Live Kenyan place search and on-site weather come from Open-Meteo.

**Audience:** Kenyan citizens and emergency operations admins.

---

## Installation

You need **Node.js 20+** and npm.

```bash
git clone <your-repo-url>
cd ajalihq/frontend
npm install
```

Environment: `frontend/.env` is already set up for Open-Meteo. If you need a fresh copy:

```bash
cp .env.example .env
```

```env
VITE_GEOCODE_API_BASE=https://geocoding-api.open-meteo.com
VITE_WEATHER_API_BASE=https://api.open-meteo.com
```

---

## Run

Development:

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production build (what you ship):

```bash
cd frontend
npm run build
npm run preview
```

Frontend tests (Vitest + Testing Library):

```bash
cd frontend
npm run test:run
```

Use `npm run test` for watch mode, or `npm run test:ui` for the browser dashboard.

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Citizen | `amina@ajalihq.test` | `password` |
| Admin | `brian@ajalihq.test` | `password` |

---

## More

Full frontend README (features, routes, architecture, rubric): [`frontend/Readme.md`](frontend/Readme.md)

Walkthrough: [`frontend/docs/walkthrough.md`](frontend/docs/walkthrough.md)

Presentation: `/ppt` after the app is running

**Team:** Nina Adora, Elias Cheruiyot, James Githinji, Purity Mutheu
