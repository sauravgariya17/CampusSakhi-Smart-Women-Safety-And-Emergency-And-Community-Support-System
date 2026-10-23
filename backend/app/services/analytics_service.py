from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session

from app.models.entities import (
    CommunityPost,
    IncidentReport,
    IncidentStatusEnum,
    ModerationQueueItem,
    ModerationQueueStatusEnum,
    ModerationStatusEnum,
    ReportSourceEnum,
    SosAlert,
    SosStatusEnum,
)
from app.schemas.analytics import DailyCount, SafetyAnalyticsResponse
from app.schemas.dashboard import DashboardSummaryResponse

MIN_GROUP_SIZE = 3  # k-anonymity threshold for area suppression

OPEN_STATUSES = [
    IncidentStatusEnum.SUBMITTED.value,
    IncidentStatusEnum.UNDER_REVIEW.value,
    IncidentStatusEnum.ASSIGNED.value,
    IncidentStatusEnum.IN_PROGRESS.value,
]
RESOLVED_STATUSES = [
    IncidentStatusEnum.RESOLVED.value,
    IncidentStatusEnum.CLOSED.value,
]
ACTIVE_SOS_STATUSES = [
    SosStatusEnum.TRIGGERED.value,
    SosStatusEnum.ACKNOWLEDGED.value,
]

class AnalyticsService:
    @staticmethod
    def get_analytics(db: Session, window_days: int = 30) -> SafetyAnalyticsResponse:
        since = datetime.now() - timedelta(days=window_days)
        reports = (
            db.query(IncidentReport)
            .filter(IncidentReport.created_at >= since)
            .all()
        )

        cat_counter: Counter = Counter()
        area_counter: Counter = Counter()
        day_counter: Counter = Counter()

        for r in reports:
            if r.category:
                cat_counter[r.category] += 1
            if r.area_label and r.area_label.strip():
                area_counter[r.area_label.strip()] += 1
            if r.created_at:
                day_str = r.created_at.strftime("%Y-%m-%d")
                day_counter[day_str] += 1

        by_category: Dict[str, int] = dict(cat_counter.most_common())
        by_area: Dict[str, int] = {
            area: count
            for area, count in area_counter.most_common()
            if count >= MIN_GROUP_SIZE
        }
        trend: List[DailyCount] = [
            DailyCount(date=day, count=count)
            for day, count in sorted(day_counter.items(), key=lambda x: x[0])
        ]

        disclaimer = (
            f"These figures reflect reported incidents only, not verified or objective danger "
            f"levels. Areas with fewer than {MIN_GROUP_SIZE} reports are omitted to protect "
            f"reporter privacy on a small campus."
        )

        return SafetyAnalyticsResponse(
            reportsByCategory=by_category,
            reportsByArea=by_area,
            trend=trend,
            windowDays=window_days,
            disclaimer=disclaimer,
        )

    @staticmethod
    def get_dashboard_summary(db: Session, window_days: int = 30) -> DashboardSummaryResponse:
        analytics = AnalyticsService.get_analytics(db, window_days)

        total_incidents = db.query(IncidentReport).count()
        open_incidents = (
            db.query(IncidentReport)
            .filter(IncidentReport.status.in_(OPEN_STATUSES))
            .count()
        )
        resolved_incidents = (
            db.query(IncidentReport)
            .filter(IncidentReport.status.in_(RESOLVED_STATUSES))
            .count()
        )

        total_emergency = db.query(SosAlert).count()
        active_emergency = (
            db.query(SosAlert)
            .filter(SosAlert.status.in_(ACTIVE_SOS_STATUSES))
            .count()
        )

        total_posts = db.query(CommunityPost).count()
        pending_posts = (
            db.query(CommunityPost)
            .filter(CommunityPost.moderation_status == ModerationStatusEnum.PENDING_REVIEW.value)
            .count()
        )

        mod_pending = (
            db.query(ModerationQueueItem)
            .filter(ModerationQueueItem.status == ModerationQueueStatusEnum.PENDING.value)
            .count()
        )
        mod_approved = (
            db.query(ModerationQueueItem)
            .filter(ModerationQueueItem.status == ModerationQueueStatusEnum.APPROVED.value)
            .count()
        )
        mod_removed = (
            db.query(ModerationQueueItem)
            .filter(ModerationQueueItem.status == ModerationQueueStatusEnum.REMOVED.value)
            .count()
        )
        mod_ai = (
            db.query(ModerationQueueItem)
            .filter(ModerationQueueItem.flagged_by == ReportSourceEnum.AI.value)
            .count()
        )
        mod_user = (
            db.query(ModerationQueueItem)
            .filter(ModerationQueueItem.flagged_by == ReportSourceEnum.USER.value)
            .count()
        )

        return DashboardSummaryResponse(
            totalIncidents=total_incidents,
            openIncidents=open_incidents,
            resolvedIncidents=resolved_incidents,
            incidentsByCategory=analytics.reportsByCategory,
            incidentsByArea=analytics.reportsByArea,
            incidentTrend=analytics.trend,
            totalEmergencyEvents=total_emergency,
            activeEmergencyEvents=active_emergency,
            totalCommunityPosts=total_posts,
            pendingModerationPosts=pending_posts,
            moderationPending=mod_pending,
            moderationApproved=mod_approved,
            moderationRemoved=mod_removed,
            moderationAiFlagged=mod_ai,
            moderationUserFlagged=mod_user,
            windowDays=window_days,
            disclaimer=analytics.disclaimer,
        )
