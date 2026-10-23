import logging
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

def _normalize_db_url(db_url: str) -> str:
    """Safely encode raw '@' inside database password if multiple '@' exist in URL."""
    if "://" not in db_url:
        return db_url
    scheme, rest = db_url.split("://", 1)
    if rest.count("@") > 1:
        userinfo, hostpart = rest.rsplit("@", 1)
        if ":" in userinfo:
            user, raw_pass = userinfo.split(":", 1)
            return f"{scheme}://{user}:{quote_plus(raw_pass)}@{hostpart}"
    return db_url

def create_db_engine():
    db_url = _normalize_db_url(settings.DATABASE_URL)
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    try:
        engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
        )
        with engine.connect() as conn:
            pass
        logger.info("Connected to database successfully: %s", db_url.split("@")[-1] if "@" in db_url else db_url)
        return engine
    except Exception as exc:
        logger.warning("Could not connect to configured database: %s. Falling back to SQLite database.", exc)
        fallback_url = "sqlite:///./gehu_safety.db"
        return create_engine(fallback_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
