# CampusSakhi Backend — Python FastAPI

This directory contains the complete **Python FastAPI** backend for **CampusSakhi**, replacing the legacy Java Spring Boot backend.

## Technology Stack
- **Framework:** FastAPI + Uvicorn
- **ORM & Database:** SQLAlchemy 2.0 (SQLite locally; PostgreSQL via Psycopg 3 or MySQL via PyMySQL in production)
- **Validation & Serialization:** Pydantic v2 + `pydantic-settings`
- **Authentication & Security:** JWT (`PyJWT` HS256) + Bcrypt (`bcrypt`) + Role-Based Access Control (`USER`, `MODERATOR`, `SECURITY_STAFF`, `ADMIN`)
- **Testing:** Pytest + FastAPI `TestClient` (`httpx`)

## Running Locally

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Before starting, set `JWT_SECRET` in `.env` to a unique random value of at least 32 characters. Generate one with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Production must set `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` through the hosting provider's secret/environment settings. PostgreSQL provider URLs using `postgres://` or `postgresql://` are normalized to the installed Psycopg 3 driver. The backend refuses to start if the database is unavailable; it does not fall back to SQLite. No demo accounts are created automatically. Provision privileged accounts through a controlled process. The test suite provisions its own accounts in an isolated in-memory database.

To create the first administrator, temporarily set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` together in the backend environment (password must be at least 12 characters). Start the backend once, then remove all three variables from the hosting settings and restart. The bootstrap sets that account's role to `ADMIN` and uses the supplied password; do not leave these settings configured.

## Running Automated Tests

```bash
pytest -v
```
