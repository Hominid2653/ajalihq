# Frontend self-assessment

## What we built

A complete React + TypeScript citizen and admin app for emergency reporting in Kenya. Incidents stay in a mock service layer so Flask can replace it later without rewriting screens.

## Rubric

| Objective | Assessment |
| --- | --- |
| Structure a React app from scratch | Met. Vite, routing, Redux, role-based layouts. |
| Async with fetch or Axios | Met. `fetch` in `lib/public-http.ts` for Open-Meteo. |
| State, loading, error boundaries | Met. Page loading/error states plus `AppErrorBoundary`. |
| Intuitive, accessible navigation | Met. Citizen shell, admin shell, marketing nav, form labels. |
| Reusable, maintainable components | Met. Shared forms, media panel, conditions card, services. |
| README, walkthrough, self-assessment | Met. See `Readme.md`, `docs/walkthrough.md`, this file. |
| Live external / public data | Met for complement data. Incident CRUD remains mock by design. |

## Decisions

- Keep `data/api.ts` as the incident source of truth.
- Use Open-Meteo because it needs no key, allows browser CORS, and fits location-first reporting.
- Send only sanitized place names or rounded coordinates.
- Fall back to curated Kenyan places if the public API fails.

## Gaps we still accept

- Flask is not wired. That is Sprint 2.
- Email/SMS are mock notification records only.
- Tests cover services, RBAC, lifecycle, and the error boundary. Full page-level UI flows are not in the suite yet.
