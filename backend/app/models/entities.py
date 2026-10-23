from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column, BigInteger, String, Boolean, DateTime, Float, Integer, ForeignKey, Table, Text
)
from sqlalchemy.orm import relationship
from app.db.base import Base

BigIntType = BigInteger().with_variant(Integer, "sqlite")

class RoleEnum(str, Enum):
    USER = "USER"
    MODERATOR = "MODERATOR"
    SECURITY_STAFF = "SECURITY_STAFF"
    ADMIN = "ADMIN"

class SosCategoryEnum(str, Enum):
    PERSONAL_SAFETY = "PERSONAL_SAFETY"
    MEDICAL_EMERGENCY = "MEDICAL_EMERGENCY"
    ACCIDENT = "ACCIDENT"
    OTHER = "OTHER"

class SosStatusEnum(str, Enum):
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
    TRIGGERED = "TRIGGERED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    FALSE_ALARM = "FALSE_ALARM"
    CANCELLED = "CANCELLED"

class JourneyStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ESCALATED = "ESCALATED"
    CANCELLED = "CANCELLED"

class IncidentCategoryEnum(str, Enum):
    HARASSMENT = "HARASSMENT"
    STALKING = "STALKING"
    UNSAFE_AREA = "UNSAFE_AREA"
    VERBAL_ABUSE = "VERBAL_ABUSE"
    PHYSICAL_THREAT = "PHYSICAL_THREAT"
    EMERGENCY = "EMERGENCY"
    OTHER = "OTHER"

class PriorityLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentVisibilityEnum(str, Enum):
    ANON_PUBLIC = "ANON_PUBLIC"
    NAMED_ADMIN_ONLY = "NAMED_ADMIN_ONLY"
    FULL_ANON = "FULL_ANON"

class IncidentStatusEnum(str, Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class PostCategoryEnum(str, Enum):
    HARASSMENT = "HARASSMENT"
    STALKING = "STALKING"
    EVE_TEASING = "EVE_TEASING"
    UNSAFE_LIGHTING = "UNSAFE_LIGHTING"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    SAFETY_TIP = "SAFETY_TIP"
    QUESTION = "QUESTION"
    SUPPORT = "SUPPORT"

class ModerationStatusEnum(str, Enum):
    PUBLISHED = "PUBLISHED"
    PENDING_REVIEW = "PENDING_REVIEW"
    REMOVED = "REMOVED"

class ModerationQueueStatusEnum(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REMOVED = "REMOVED"

class ReportSourceEnum(str, Enum):
    AI = "AI"
    USER = "USER"

class TargetTypeEnum(str, Enum):
    POST = "POST"
    COMMENT = "COMMENT"

class NotificationChannelEnum(str, Enum):
    EMAIL = "EMAIL"
    CONSOLE_SIMULATION = "CONSOLE_SIMULATION"

class NotificationLogStatusEnum(str, Enum):
    SENT = "SENT"
    FAILED = "FAILED"
    SIMULATED = "SIMULATED"

# Association table for Journey <-> TrustedContact
journey_trusted_contacts = Table(
    "journey_trusted_contacts",
    Base.metadata,
    Column("journey_id", BigIntType, ForeignKey("journeys.journey_id", ondelete="CASCADE"), primary_key=True),
    Column("contact_id", BigIntType, ForeignKey("trusted_contacts.contact_id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column("user_id", BigIntType, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    phone_encrypted = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="USER")
    anonymous_handle = Column(String(50), nullable=False, unique=True, index=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column("token_id", BigIntType, primary_key=True, autoincrement=True)
    user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    token = Column(String(512), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    user = relationship("User", back_populates="refresh_tokens")

class TrustedContact(Base):
    __tablename__ = "trusted_contacts"

    id = Column("contact_id", BigIntType, primary_key=True, autoincrement=True)
    user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    relation = Column(String(50), nullable=True)
    priority = Column(Integer, nullable=False, default=1)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    user = relationship("User", back_populates="contacts")

class Journey(Base):
    __tablename__ = "journeys"

    id = Column("journey_id", BigIntType, primary_key=True, autoincrement=True)
    user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.now)
    expected_arrival = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVE", index=True)
    last_known_lat = Column(Float, nullable=True)
    last_known_lng = Column(Float, nullable=True)
    last_ping_at = Column(DateTime, nullable=True)
    tracking_token = Column(String(100), nullable=False, unique=True, index=True)

    user = relationship("User")
    notified_contacts = relationship("TrustedContact", secondary=journey_trusted_contacts)

class SosAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column("sos_id", BigIntType, primary_key=True, autoincrement=True)
    user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    category = Column(String(30), nullable=False, default="PERSONAL_SAFETY")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String(30), nullable=False, default="PENDING_CONFIRMATION", index=True)
    confirmation_expires_at = Column(DateTime, nullable=True)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    acknowledged_by_id = Column("acknowledged_by", BigIntType, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(String(1000), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
    notification_logs = relationship("NotificationLog", back_populates="sos_alert", cascade="all, delete-orphan")

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column("log_id", BigIntType, primary_key=True, autoincrement=True)
    sos_id = Column(BigIntType, ForeignKey("sos_alerts.sos_id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(BigIntType, ForeignKey("trusted_contacts.contact_id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(30), nullable=False)
    recipient = Column(String(150), nullable=False)
    status = Column(String(20), nullable=False)
    sent_at = Column(DateTime, nullable=False, default=datetime.now)

    sos_alert = relationship("SosAlert", back_populates="notification_logs")
    contact = relationship("TrustedContact")

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column("report_id", BigIntType, primary_key=True, autoincrement=True)
    user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    description = Column(String(3000), nullable=False)
    category = Column(String(30), nullable=False)
    priority = Column(String(20), nullable=False)
    ai_suggested_category = Column(String(30), nullable=True)
    ai_suggested_priority = Column(String(20), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_reasoning = Column(String(500), nullable=True)
    ai_summary = Column(String(800), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    area_label = Column(String(120), nullable=True)
    evidence_url = Column(String(500), nullable=True)
    visibility_type = Column(String(30), nullable=False, default="ANON_PUBLIC")
    status = Column(String(20), nullable=False, default="SUBMITTED")
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    assigned_to_id = Column("assigned_to", BigIntType, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    reviewed_by_id = Column("reviewed_by", BigIntType, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column("post_id", BigIntType, primary_key=True, autoincrement=True)
    author_user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    anonymous_handle_snapshot = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(String(5000), nullable=False)
    category = Column("tag", String(40), nullable=True)
    area_label = Column(String(120), nullable=True)
    ai_toxicity_score = Column(Float, nullable=True)
    moderation_status = Column(String(20), nullable=False, default="PUBLISHED", index=True)
    upvote_count = Column(Integer, nullable=False, default=0)
    downvote_count = Column(Integer, nullable=False, default=0)
    comment_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    author = relationship("User")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column("comment_id", BigIntType, primary_key=True, autoincrement=True)
    post_id = Column(BigIntType, ForeignKey("community_posts.post_id", ondelete="CASCADE"), nullable=False)
    author_user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    anonymous_handle_snapshot = Column(String(50), nullable=False)
    body = Column(String(2000), nullable=False)
    moderation_status = Column(String(20), nullable=False, default="PUBLISHED")
    upvote_count = Column(Integer, nullable=False, default=0)
    downvote_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User")

class Vote(Base):
    __tablename__ = "votes"

    id = Column("vote_id", BigIntType, primary_key=True, autoincrement=True)
    user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String(20), nullable=False)
    target_id = Column(BigIntType, nullable=False)
    vote_value = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    user = relationship("User")

class ModerationQueueItem(Base):
    __tablename__ = "moderation_queue"

    id = Column("queue_id", BigIntType, primary_key=True, autoincrement=True)
    target_type = Column(String(20), nullable=False)
    target_id = Column(BigIntType, nullable=False)
    reason = Column(String(500), nullable=True)
    flagged_by = Column(String(20), nullable=False)
    reporter_user_id = Column(BigIntType, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, default="PENDING")
    reviewed_by_id = Column("reviewed_by", BigIntType, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    reporter = relationship("User", foreign_keys=[reporter_user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column("log_id", BigIntType, primary_key=True, autoincrement=True)
    actor_user_id = Column(BigIntType, ForeignKey("users.user_id"), nullable=False)
    action_type = Column(String(80), nullable=False)
    target_type = Column(String(40), nullable=True)
    target_id = Column(BigIntType, nullable=True)
    reason = Column(String(500), nullable=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.now)

    actor = relationship("User")

class SafeZone(Base):
    __tablename__ = "safe_zones"

    id = Column("zone_id", BigIntType, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    type = Column(String(60), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    description = Column(String(300), nullable=True)

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column("hotspot_id", BigIntType, primary_key=True, autoincrement=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    radius_meters = Column(Integer, nullable=False, default=100)
    incident_count = Column(Integer, nullable=False, default=0)
    last_computed_at = Column(DateTime, nullable=False, default=datetime.now)
