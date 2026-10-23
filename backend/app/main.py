"""FastAPI entry point for CampusSakhi backend."""

import asyncio
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    admin,
    analytics,
    auth,
    community,
    contacts,
    incidents,
    journeys,
    map as map_router,
    moderation,
    sos,
    users,
)
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.exceptions.handlers import register_exception_handlers
from app.services.journey_service import JourneyService
from app.services.map_service import MapService
from app.services.sos_service import SosService

logger = logging.getLogger(__name__)

async def _background_maintenance_loop():
    """Periodically expires unconfirmed SOS alerts and escalates overdue journeys."""
    while True:
        try:
            await asyncio.sleep(10)
            db = SessionLocal()
            try:
                SosService.expire_unconfirmed_alerts(db)
                JourneyService.escalate_overdue_journeys(db)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.debug("Background maintenance loop error: %s", exc)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        MapService.seed_defaults_if_empty(db)
    except Exception as exc:
        logger.warning("Database seed check skipped: %s", exc)
    finally:
        db.close()

    task = asyncio.create_task(_background_maintenance_loop())
    yield
    task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="FastAPI implementation for CampusSakhi — Smart Women Safety, Emergency and Community Support System.",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Register unified exception handlers matching Spring Boot ApiErrorResponse
register_exception_handlers(app)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Trusted Contacts"])
app.include_router(sos.router, prefix="/api/sos", tags=["Emergency SOS"])
app.include_router(journeys.router, prefix="/api/journeys", tags=["Safety Journeys"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incident Reports"])
app.include_router(community.router, prefix="/api/community", tags=["Anonymous Community"])
app.include_router(moderation.router, prefix="/api/moderation", tags=["Moderation"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Safety Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin & Governance"])
app.include_router(map_router.router, prefix="/api/map", tags=["Campus Map"])

@app.get("/api/health", tags=["Health"])
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": "2.0.0"}
