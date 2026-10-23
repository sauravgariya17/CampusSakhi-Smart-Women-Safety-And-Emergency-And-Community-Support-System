# CampusSakhi — Smart Women Safety, Emergency & Community Support System (GEHU)

**CampusSakhi (v2.0)** is a full-stack campus women safety, emergency SOS, live journey tracking, AI-assisted incident reporting, and zero-PII anonymous community platform built for **Graphic Era Hill University (GEHU), Dehradun**.

The backend has been **completely migrated from Java Spring Boot to Python FastAPI**, while the frontend has been **redesigned into a modern, responsive, accessible safety suite** built with React 18, Tailwind CSS, and Leaflet/OpenStreetMap.

---

## Key Capabilities

1. **2-Stage Emergency SOS (`PENDING_CONFIRMATION` → `TRIGGERED`)**
   - Prevents accidental false alarms via an **8-second countdown confirmation window** with instant 1-tap cancel or immediate dispatch.
   - Dispatches notifications to the student's **Trusted Circle (up to 5 prioritized contacts)** and alerts the **Campus Security Dispatch Console**.
   - Transparently distinguishes between **Simulated Mode (`CONSOLE_SIMULATION`)** and **Live SMTP Email Mode (`EMAIL`)**—never shows a fake alert when real notifications are disabled.

2. **Campus Journey Mode & Live Geofenced Tracking**
   - Enforces a **2.0 km GEHU campus operational radius** (`30.2675° N, 77.9959° E`) using the Haversine distance formula.
   - Supports interactive Leaflet map waypoint selection and 1-click GEHU campus landmark presets.
   - Generates a **read-only public share link (`/track/:token`)** for trusted contacts that automatically expires the moment the student checks in (`COMPLETED`) or cancels (`CANCELLED`).
   - Automatically escalates overdue journeys (`ESCALATED`) to Campus Security and creates an SOS alert.

3. **AI-Assisted Incident Reporting with Strict Anonymity Modes**
   - Built-in rule/keyword-weighted NLP classifier suggests incident category, priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), confidence score, reasoning, and extractive summary before submission.
   - Supports three explicit privacy modes:
     - `ANON_PUBLIC`: Contributes to anonymised campus analytics (`k >= 3`); reporter identity is hidden from admins.
     - `NAMED_ADMIN_ONLY`: Shares reporter name with authorized campus reviewers for direct follow-up.
     - `FULL_ANON`: Maximum privacy; reporter identity is never exposed in admin views.

4. **Zero-PII Anonymous Community & Moderation Queue**
   - Every user receives a unique, non-reversible handle (`u/adjective_noun_number`, e.g., `u/brave_sparrow_101`).
   - Public community APIs never serialize real names, emails, or user IDs.
   - Automated toxicity/spam/duplicate detection routes flagged posts and comments into the **Moderation Queue (`PENDING_REVIEW`)** for human review (`MODERATOR` / `ADMIN`).

5. **k-Anonymity Safety Analytics & Governance Console**
   - Enforces `MIN_GROUP_SIZE = 3` (`k >= 3`) on area-level incident aggregations so areas with fewer than 3 reports are suppressed to prevent re-identification.
   - Role-based governance console for `MODERATOR`, `SECURITY_STAFF`, and `ADMIN` with immutable audit logging (`AuditLog`).

---

## Project Architecture

```text
A-Smart-Women-Safety-Emergency-Community-Support-System/
├── backend/                     # Python FastAPI Backend (Replaced Java Spring Boot)
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point, CORS, lifespan DB init
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic Settings (.env configuration)
│   │   │   └── security.py      # JWT HS256 auth, Bcrypt hashing, RBAC dependencies
│   │   ├── db/
│   │   │   ├── base.py          # SQLAlchemy DeclarativeBase
│   │   │   └── session.py       # MySQL primary engine + automatic SQLite fallback
│   │   ├── models/
│   │   │   └── entities.py      # 13 SQLAlchemy ORM models matching gehu_safety_db
│   │   ├── schemas/             # Pydantic v2 request/response DTOs (camelCase aliases)
│   │   ├── services/            # Business logic, AI triage, notifications, k-anonymity
│   │   ├── api/routes/          # 11 modular APIRouters (44 endpoints under /api/*)
│   │   └── exceptions/          # Unified ApiErrorResponse exception handlers
│   ├── tests/
│   │   └── test_api_complete.py # Comprehensive Pytest suite covering all 44 endpoints
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
└── frontend/                    # React 18 + Vite + Tailwind CSS + React-Leaflet
    ├── src/
    │   ├── api/                 # Axios API client & modular service wrappers
    │   ├── components/          # NavBar, ProtectedRoute
    │   ├── context/             # AuthContext, ToastContext
    │   └── pages/               # Redesigned responsive pages (Landing, Hub, SOS, etc.)
    ├── package.json
    └── .env.example
```

---

## Quick Start Guide

### 1. Backend Setup (Python FastAPI)

**Prerequisites:** Python 3.11+ (tested on Python 3.11 / 3.12). MySQL 8.0+ is supported out of the box (`gehu_safety_db`), with automatic fallback to local SQLite (`campussakhi.db`) if MySQL is not running.

```bash
cd backend

# Optional: create and activate a virtual environment
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration and customize if needed
cp .env.example .env

# Start the FastAPI server on port 8080
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

- **API Base URL:** `http://localhost:8080`
- **Interactive Swagger UI:** `http://localhost:8080/docs`
- **Health Check:** `http://localhost:8080/api/health`

### 2. Frontend Setup (React + Vite)

**Prerequisites:** Node.js 18+ and npm.

```bash
cd frontend

# Install dependencies
npm install

# Copy environment configuration if needed
cp .env.example .env

# Start the Vite development server on port 5173
npm run dev
```

- **Frontend URL:** `http://localhost:5173`

---

## Seeded Demo Accounts (Local Testing)

When the database is initialized, four demo role accounts are automatically available (and can be filled with 1 click on the `/login` page):

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Student (`USER`)** | `student@gehu.ac.in` | `Safety@123` | Emergency SOS, Trusted Contacts, Journey Mode, Incident Reporting, Anonymous Community |
| **Moderator (`MODERATOR`)** | `moderator@gehu.ac.in` | `Safety@123` | All Student features + Community Moderation Queue (`/admin/moderation`) |
| **Security (`SECURITY_STAFF`)** | `security@gehu.ac.in` | `Safety@123` | Live SOS Dispatch Console (`/admin/security`), Incident Review, Safety Analytics |
| **Administrator (`ADMIN`)** | `admin@gehu.ac.in` | `Safety@123` | Full Governance Console (`/admin`), User Role/Status Management, Audit Logs |

---

## Running Automated Tests

### Backend Test Suite (`pytest`)
The backend includes a full automated test suite in `backend/tests/test_api_complete.py` using an isolated in-memory SQLite database and `NOTIFICATION_EMAIL_ENABLED=False` (no real emergency services or emails are ever contacted during testing):

```bash
cd backend
pytest -v
```

### Frontend Production Build Check
```bash
cd frontend
npm run build
```

---

## Complete Endpoint Mapping (Spring Boot → FastAPI)

All 44 original Spring Boot endpoints have been preserved with identical HTTP methods, URL paths, request validation rules, and JSON response envelopes (`ApiResponse` / `ApiErrorResponse` / `PageResponse`):

| Module | Method & Path | Access Rule | FastAPI Router |
| :--- | :--- | :--- | :--- |
| **Health** | `GET /api/health` | Public | `app/main.py` |
| **Auth** | `POST /api/auth/register` | Public | `app/api/routes/auth.py` |
| **Auth** | `POST /api/auth/login` | Public | `app/api/routes/auth.py` |
| **Auth** | `POST /api/auth/refresh` | Public | `app/api/routes/auth.py` |
| **Auth** | `POST /api/auth/logout` | Public | `app/api/routes/auth.py` |
| **Users** | `GET /api/users/me` | Authenticated | `app/api/routes/users.py` |
| **Trusted Contacts** | `GET /api/contacts` | Authenticated | `app/api/routes/contacts.py` |
| **Trusted Contacts** | `POST /api/contacts` | Authenticated (Max 5) | `app/api/routes/contacts.py` |
| **Trusted Contacts** | `PUT /api/contacts/{contact_id}` | Authenticated (Owner) | `app/api/routes/contacts.py` |
| **Trusted Contacts** | `DELETE /api/contacts/{contact_id}` | Authenticated (Owner) | `app/api/routes/contacts.py` |
| **Emergency SOS** | `POST /api/sos/trigger` | Authenticated | `app/api/routes/sos.py` |
| **Emergency SOS** | `POST /api/sos/{sos_id}/confirm` | Authenticated (Owner) | `app/api/routes/sos.py` |
| **Emergency SOS** | `POST /api/sos/{sos_id}/cancel` | Authenticated (Owner) | `app/api/routes/sos.py` |
| **Emergency SOS** | `GET /api/sos/active` | Authenticated | `app/api/routes/sos.py` |
| **Emergency SOS** | `GET /api/sos/history` | Authenticated | `app/api/routes/sos.py` |
| **SOS Dispatch** | `GET /api/sos/manage/active` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/sos.py` |
| **SOS Dispatch** | `POST /api/sos/manage/{sos_id}/acknowledge` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/sos.py` |
| **SOS Dispatch** | `POST /api/sos/manage/{sos_id}/resolve` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/sos.py` |
| **Journeys** | `POST /api/journeys` | Authenticated (2km scope) | `app/api/routes/journeys.py` |
| **Journeys** | `POST /api/journeys/{journey_id}/ping` | Authenticated (Owner) | `app/api/routes/journeys.py` |
| **Journeys** | `POST /api/journeys/{journey_id}/checkin` | Authenticated (Owner) | `app/api/routes/journeys.py` |
| **Journeys** | `POST /api/journeys/{journey_id}/cancel` | Authenticated (Owner) | `app/api/routes/journeys.py` |
| **Journeys** | `GET /api/journeys/active` | Authenticated | `app/api/routes/journeys.py` |
| **Journeys** | `GET /api/journeys/history` | Authenticated | `app/api/routes/journeys.py` |
| **Journeys** | `GET /api/journeys/track/{token}` | Public (Active token) | `app/api/routes/journeys.py` |
| **Incidents** | `POST /api/incidents/analyze` | Authenticated | `app/api/routes/incidents.py` |
| **Incidents** | `POST /api/incidents` | Authenticated | `app/api/routes/incidents.py` |
| **Incidents** | `GET /api/incidents/mine` | Authenticated | `app/api/routes/incidents.py` |
| **Incident Admin** | `GET /api/admin/incidents` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/incidents.py` |
| **Incident Admin** | `PATCH /api/admin/incidents/{report_id}/review` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/incidents.py` |
| **Community** | `GET /api/community/posts` | Authenticated | `app/api/routes/community.py` |
| **Community** | `GET /api/community/posts/{post_id}` | Authenticated | `app/api/routes/community.py` |
| **Community** | `POST /api/community/posts` | Authenticated | `app/api/routes/community.py` |
| **Community** | `GET /api/community/posts/{post_id}/comments` | Authenticated | `app/api/routes/community.py` |
| **Community** | `POST /api/community/posts/{post_id}/comments` | Authenticated | `app/api/routes/community.py` |
| **Community** | `POST /api/community/posts/{post_id}/vote` | Authenticated | `app/api/routes/community.py` |
| **Community** | `POST /api/community/comments/{comment_id}/vote` | Authenticated | `app/api/routes/community.py` |
| **Community** | `POST /api/community/report` | Authenticated | `app/api/routes/community.py` |
| **Moderation** | `GET /api/moderation/queue` | `MODERATOR`, `ADMIN` | `app/api/routes/moderation.py` |
| **Moderation** | `POST /api/moderation/queue/{queue_id}/review` | `MODERATOR`, `ADMIN` | `app/api/routes/moderation.py` |
| **Analytics** | `GET /api/analytics/safety` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/analytics.py` |
| **Admin** | `GET /api/admin/dashboard/summary` | `SECURITY_STAFF`, `ADMIN` | `app/api/routes/admin.py` |
| **Admin** | `GET /api/admin/users` | `ADMIN` | `app/api/routes/admin.py` |
| **Admin** | `PATCH /api/admin/users/{user_id}/role` | `ADMIN` | `app/api/routes/admin.py` |
| **Admin** | `PATCH /api/admin/users/{user_id}/status` | `ADMIN` | `app/api/routes/admin.py` |
| **Admin** | `GET /api/admin/audit-logs` | `ADMIN` | `app/api/routes/admin.py` |
| **Campus Map** | `GET /api/map/config` | Public | `app/api/routes/map.py` |
| **Campus Map** | `GET /api/map/safe-zones` | Public | `app/api/routes/map.py` |
