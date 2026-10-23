# CampusSakhi Backend — Python FastAPI

This directory contains the complete **Python FastAPI** backend for **CampusSakhi**, replacing the legacy Java Spring Boot backend.

## Technology Stack
- **Framework:** FastAPI + Uvicorn
- **ORM & Database:** SQLAlchemy 2.0 (`mysql+pymysql` for MySQL `gehu_safety_db` with automatic SQLite fallback)
- **Validation & Serialization:** Pydantic v2 + `pydantic-settings`
- **Authentication & Security:** JWT (`PyJWT` HS256) + Bcrypt (`bcrypt`) + Role-Based Access Control (`USER`, `MODERATOR`, `SECURITY_STAFF`, `ADMIN`)
- **Testing:** Pytest + FastAPI `TestClient` (`httpx`)

## Running Locally

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

## Running Automated Tests

```bash
pytest -v
```
