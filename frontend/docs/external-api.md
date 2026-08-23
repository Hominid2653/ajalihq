# External public APIs (frontend only)

Ajali! keeps incident, auth, media, and admin data in the local mock service layer (`src/data/api.ts`). That contract is unchanged.

A second, public data path uses **Open-Meteo** so the frontend can demonstrate live `fetch`, loading, and errors without Flask.

```text
UI
├── incidentApi / mediaApi / auth  →  data/api.ts (mock, unchanged)
└── geocodeApi / weatherApi        →  Open-Meteo via fetch
```

## Endpoints

| Use | Service | Request | Sent to vendor |
| --- | --- | --- | --- |
| Place search | `src/services/geocode-api.ts` | `GET /v1/search` | Sanitized place name, `countryCode=KE` |
| On-site weather | `src/services/weather-api.ts` | `GET /v1/forecast` | Rounded latitude and longitude only |

Official docs: [Open-Meteo](https://open-meteo.com/). License: CC BY 4.0. Attribution is shown in the UI.

No API key is required. Do not add secrets to the frontend.

## Security controls

Implemented in `src/lib/public-http.ts` and the two services.

1. **HTTPS only.** `http://` bases are rejected.
2. **Host allow-list.** Only `geocoding-api.open-meteo.com` and `api.open-meteo.com`. A tampered `VITE_*` value falls back to those hosts.
3. **No credentials.** `credentials: "omit"`, `referrerPolicy: "no-referrer"`, no `Authorization` header.
4. **No PII and no incident payload.** Search sends a cleaned place string. Weather sends rounded coordinates. Title, description, reporter name, email, phone, media, and session tokens are never attached.
5. **Input sanitization.** Control characters, HTML, and URLs are stripped. Query length is capped. Coordinates must be finite and in range, then rounded (4 to 5 decimals).
6. **Kenya scope.** Geocoding requests `countryCode=KE` and drops any result that is not `KE`.
7. **Timeouts and abort.** 8 second timeout plus `AbortController` when the user types again or leaves the page.
8. **Debounce.** Place search waits 400ms to avoid hammering the public API.
9. **Response validation.** JSON is parsed only after `Content-Type` checks. Numbers and labels are re-validated before render. Labels are escaped of `<>`.
10. **Safe failure.** If Open-Meteo fails, the UI falls back to the saved Kenyan place list. Weather shows a local error. Incident create/update still uses the mock API.
11. **Error boundary.** `AppErrorBoundary` wraps the app so a render crash does not leak internals.
12. **Env files.** Copy `frontend/.env.example`. Real `.env` files are gitignored. These variables are public hostnames, not secrets.

## Where it appears

- Citizen report form: live place search + conditions at the pin
- Admin create/edit form: same
- Citizen and admin incident detail: conditions at saved coordinates

## What we do not do

- Do not proxy through Flask yet
- Do not store Open-Meteo responses in the incident record
- Do not call Open-Meteo with reporter or report text
- Do not use Axios or extra keys
