# 🚨 Ajali!

> **See it. Report it. Respond to it.**

Ajali! is a citizen-powered emergency incident reporting and response platform designed for Kenya.

The platform allows citizens to report accidents and emergencies with descriptions, geolocation, images, and videos. Reports are first received and reviewed by administrators before becoming publicly visible as active incidents.

Once an incident is verified and response efforts begin, it appears on the Ajali! public incident map, allowing people in the surrounding area to become aware of active emergencies.

The platform also provides email and SMS notifications to keep reporters informed throughout the incident lifecycle.

---

## Problem

Accidents and emergencies happen frequently, but the speed at which accurate information reaches the appropriate people can determine the outcome.

Traditional reporting channels can create delays between:

**Incident → Report → Verification → Response → Resolution**

Ajali! aims to reduce this gap by providing a centralized, location-aware platform where citizens can quickly report emergencies while administrators can verify, coordinate, monitor, and close incidents.

---

## Solution

Ajali! creates a structured emergency reporting workflow:

```text
Citizen
   │
   │ Reports incident
   ▼
PENDING
   │
   │ Admin review
   ├───────────────────┐
   ▼                   ▼
VERIFIED             CLOSED
   │                 (false/invalid)
   │
   │ Response begins
   ▼
IN_PROGRESS
   │
   │ Incident resolved
   ▼
RESOLVED
```

Only incidents marked **IN_PROGRESS** appear on the public active-incident map.

This prevents unverified or potentially false reports from immediately creating public panic.

---

# Incident Lifecycle

## 1. Pending

A citizen submits an incident report.

The report contains information such as:

* Incident type
* Title
* Description
* Severity
* Location
* Latitude and longitude
* Images
* Videos

The incident is initially marked:

```text
PENDING
```

The reporter receives a confirmation notification.

The incident is **not visible on the public active map**.

---

## 2. Verified

An administrator reviews the report and confirms that it appears to be legitimate.

```text
PENDING → VERIFIED
```

The reporter is notified that their report has been verified.

The incident is still not displayed as an active public incident because verification does not necessarily mean that response efforts have started.

---

## 3. In Progress

When response/action begins:

```text
VERIFIED → IN_PROGRESS
```

This is the key public visibility state.

The incident now appears on the Ajali! active incident map.

Users can see:

* Incident type
* General location
* Severity
* Current status
* Time reported
* Relevant approved information

The reporter receives an SMS and/or email notification informing them that response efforts are underway.

---

## 4. Resolved

When the incident has been dealt with:

```text
IN_PROGRESS → RESOLVED
```

The administrator records a resolution note.

For example:

> Accident cleared. Vehicles removed and traffic restored.

The incident is removed from the active map but remains in the database for historical records, analytics, and auditing.

The reporter receives a resolution notification.

---

## 5. Closed

An administrator can close a report when it is determined to be:

* False
* Invalid
* Duplicate
* Insufficiently supported
* Otherwise unsuitable for response

```text
PENDING → CLOSED
```

Closed incidents do not appear on the public map.

The reporter is notified of the closure.

---

# 🗺️ Active Incident Map

The Ajali! map is designed to provide awareness of ongoing incidents.

The public map only displays incidents with:

```text
status = IN_PROGRESS
```

Example:

```text
                    AJALI!

       ┌─────────────────────────────┐
       │                             │
       │          🔴                 │
       │       ROAD ACCIDENT         │
       │                             │
       │                    🔥       │
       │                   FIRE      │
       │                             │
       │              🏥             │
       │           MEDICAL           │
       │                             │
       └─────────────────────────────┘
```

Users can select an incident marker to view relevant information.

The platform can use the user's location to prioritize incidents around their area.

---

# Geolocation

Incident reports contain:

```text
latitude
longitude
location_name
```

The browser's Geolocation API can be used to capture the user's current location.

Google Maps is then used to visualize incident locations.

The architecture is:

```text
User GPS
   ↓
Latitude + Longitude
   ↓
React
   ↓
Flask API
   ↓
PostgreSQL
   ↓
Google Maps
```

---

# Notifications

Notifications are a major part of the Ajali! MVP.

The reporter can receive notifications whenever the incident changes state.

| Event             | Notification |
| ----------------- | ------------ |
| Report received   | Email / SMS  |
| Report verified   | Email / SMS  |
| Response started  | Email / SMS  |
| Incident resolved | Email / SMS  |
| Report closed     | Email / SMS  |

The planned notification providers are:

* **Brevo** for transactional email
* **Africa's Talking** for SMS

The frontend does not communicate directly with these providers.

Instead:

```text
React
  ↓
Flask
  ↓
PostgreSQL
  ↓
Notification Service
  ├── Brevo
  └── Africa's Talking
```

---

# User Features

Citizens can:

* Create an account
* Log in
* Submit incident reports
* Add incident descriptions
* Select incident categories
* Set incident severity
* Add geolocation
* Update incident location
* Upload images
* Upload videos
* Edit eligible reports
* Delete/withdraw eligible reports
* View their submitted reports
* View incident status
* Receive email notifications
* Receive SMS notifications
* View active incidents on the map

### Important reporting rule

Citizens can edit or withdraw reports while they are still pending.

Once an incident has been verified, the citizen can no longer modify or delete the incident.

This preserves the administrative audit trail.

---

# Admin Features

Administrators can:

* View incoming reports
* Review incident details
* Review submitted media
* View incident locations
* Verify legitimate reports
* Close false/invalid reports
* Start incident response
* Mark incidents as resolved
* Add investigation notes
* Add resolution notes
* View incident status history
* Monitor active incidents
* View notification status
* View incident statistics

---

# Technology Stack

## Frontend

* React
* Vite
* TypeScript / TSX
* Tailwind CSS
* shadcn/ui
* Redux Toolkit
* React Router
* Google Maps

## Backend

* Python
* Flask
* Flask REST API
* SQLAlchemy
* PostgreSQL
* JWT authentication

## Development Mock API

During frontend development, JSON Server is used to simulate the backend API.

```text
React
  ↓
JSON Server
  ↓
db.json
```

Once the Flask backend is ready:

```text
React
  ↓
Flask REST API
  ↓
PostgreSQL
```

The frontend service layer is designed so the backend implementation can be replaced without rewriting the UI.

## Notifications

* Brevo — Email
* Africa's Talking — SMS

## Testing

### Frontend

* Jest
* React Testing Library

### Backend

* Python unittest

## Design

The official UI/UX design is maintained in Figma.

The implementation should follow the approved Figma design while maintaining responsive, mobile-first behavior.

---

# 🗄️ Database

Ajali! uses PostgreSQL.

The main entities are:

```text
users
   │
   └── incidents
          │
          ├── incident_types
          ├── incident_media
          ├── incident_status_history
          └── notifications
```

### Core tables

| Table                     | Purpose                        |
| ------------------------- | ------------------------------ |
| `users`                   | Citizens and administrators    |
| `incident_types`          | Emergency categories           |
| `incidents`               | Main incident records          |
| `incident_media`          | Images and videos              |
| `incident_status_history` | Complete incident audit trail  |
| `notifications`           | Email/SMS notification records |

The database ERD is available at:

```text
docs/ERD.dbml
```

The DBML can be imported into dbdiagram.io.

---

# 🔌 API Design

The frontend should communicate with the backend through a service layer.

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Incidents

```http
GET    /api/incidents
POST   /api/incidents
GET    /api/incidents/:id
PATCH  /api/incidents/:id
DELETE /api/incidents/:id
```

### Active map

```http
GET /api/incidents/active
```

This endpoint should return only:

```text
status = in_progress
```

### Nearby incidents

Future endpoint:

```http
GET /api/incidents/nearby?lat={lat}&lng={lng}&radius={km}
```

### Media

```http
POST   /api/incidents/:id/media
DELETE /api/incidents/:id/media/:mediaId
```

### Incident status

```http
PATCH /api/incidents/:id/status
GET   /api/incidents/:id/history
```

Only authorized administrators can change incident status.

---

# Security & Integrity

Because Ajali! deals with emergency information, data integrity is important.

The system should:

* Authenticate users
* Authorize administrative actions
* Validate incident data
* Validate uploaded files
* Restrict file types and sizes
* Protect API keys and secrets
* Never expose passwords
* Store password hashes instead of plaintext passwords
* Maintain an incident status history
* Prevent citizens from modifying verified incidents
* Prevent deleted reports from bypassing the audit trail
* Restrict public map data to appropriate active incidents

---

# Mobile First & Progressive Web App

Ajali! is designed primarily around mobile use because incidents are likely to be reported from the field.

The application is being built as a **Progressive Web App (PWA)**, allowing users to access Ajali! from a mobile browser while providing an app-like experience.

The PWA approach allows Ajali! to:

- Work across modern mobile and desktop browsers
- Be installable on supported devices
- Provide an app-like user experience
- Support responsive mobile-first layouts
- Use device geolocation for incident reporting
- Provide fast access to emergency reporting
- Support a service worker for improved loading and caching
- Support future push notifications
- Avoid requiring users to download a traditional native mobile application

The primary reporting flow should therefore be fast and optimized for mobile:

```text
REPORT EMERGENCY
       ↓
INCIDENT TYPE
       ↓
DESCRIPTION
       ↓
LOCATION
       ↓
PHOTO / VIDEO
       ↓
SUBMIT
# Future Analytics

The stored incident lifecycle enables future statistics such as:

* Active incidents
* Incidents reported today
* Incidents resolved today
* Incidents by category
* Incidents by location
* Average verification time
* Average response time
* Average resolution time
* False/closed reports
* Most affected areas

Example admin dashboard:

```text
┌─────────────────────────────────────────┐
│ AJALI! ADMIN DASHBOARD                  │
├────────────┬────────────┬───────────────┤
│ ACTIVE     │ TODAY      │ RESOLVED      │
│ 12         │ 37         │ 24            │
├────────────┼────────────┼───────────────┤
│ VERIFYING  │ RESPONSE   │ AVG RESOLVE   │
│ 8          │ 14 min     │ 41 min        │
└────────────┴────────────┴───────────────┘
```

---

# Development Strategy

Ajali! is being developed in stages.

### Phase 1 — Frontend Foundation

* React/Vite setup
* TypeScript
* Tailwind
* shadcn/ui
* Figma implementation
* Routing
* Redux Toolkit
* JSON Server

### Phase 2 — Citizen Features

* Registration
* Login
* Citizen dashboard
* Incident reporting
* Incident editing
* Incident deletion/withdrawal
* Media uploads
* Geolocation

### Phase 3 — Admin Features

* Admin dashboard
* Incident queue
* Incident verification
* Incident closure
* Response management
* Resolution workflow
* Status history

### Phase 4 — Map

* Google Maps
* Incident markers
* Active incident filtering
* User geolocation
* Nearby incidents

### Phase 5 — Notifications

* Email notifications
* SMS notifications
* Notification preferences
* Notification delivery tracking

### Phase 6 — Backend

* Flask REST API
* PostgreSQL
* SQLAlchemy
* Authentication
* Authorization
* File/media storage
* Notification services

### Phase 7 — Testing

* Frontend unit tests
* Component tests
* API tests
* Backend tests
* Authentication tests
* Incident lifecycle tests
* Notification tests

---

# Team Development

Uses feature branches.

Example:

```text
main
│
├── feature/auth
├── feature/incident-reporting
├── feature/admin-dashboard
├── feature/maps
├── feature/notifications
└── feature/ui
```

Recommended workflow:

```text
Create branch
     ↓
Develop feature
     ↓
Test
     ↓
Commit
     ↓
Pull Request
     ↓
Code Review
     ↓
Merge into main
```

---

# Project Structure

```text
ajalihq/
│
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   ├── incidents/
│   │   ├── maps/
│   │   ├── notifications/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── incidents/
│   │   ├── notifications/
│   │   └── admin/
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── user/
│   │   └── admin/
│   ├── services/
│   ├── store/
│   ├── types/
│   ├── lib/
│   └── main.tsx
│
├── docs/
│   └── ERD.dbml
│
├── db.json
├── package.json
├── README.md
└── ...
```

---

# Vision

Ajali! aims to make emergency reporting faster, more structured, and more transparent by connecting citizens, administrators, and communities through a location-aware emergency information platform.

The core principle is:

> **Report quickly. Verify responsibly. Respond visibly. Resolve completely.**

---

## 📄 Project Information

**Project:** Ajali!
**Type:** Full-Stack Emergency Incident Reporting Platform
**Frontend:** React + TypeScript
**Backend:** Flask + Python
**Database:** PostgreSQL
**Development API:** JSON Server
**Maps:** Google Maps
**Email:** Brevo
**SMS:** Africa's Talking
**Design:** Figma
**Testing:** Jest + React Testing Library + Python unittest
