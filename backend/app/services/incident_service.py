from datetime import datetime
import math
from typing import List, Optional
from sqlalchemy.orm import Session

from app.exceptions.handlers import ResourceNotFoundException
from app.models.entities import (
    IncidentReport,
    IncidentStatusEnum,
    IncidentVisibilityEnum,
    User,
)
from app.schemas.common import PageResponse
from app.schemas.incident import (
    CreateIncidentAnalyzeRequest,
    CreateIncidentRequest,
    IncidentAdminResponse,
    IncidentAnalysisResponse,
    IncidentResponse,
    ReviewIncidentRequest,
)
from app.services.ai_service import AiTextAnalysisService
from app.services.audit_service import AuditService

class IncidentService:
    @staticmethod
    def analyze(request: CreateIncidentAnalyzeRequest) -> IncidentAnalysisResponse:
        analysis = AiTextAnalysisService.analyze_incident(request.description)
        cls_res = analysis["classification"]
        pri_res = analysis["priority"]
        return IncidentAnalysisResponse(
            suggestedCategory=cls_res["category"],
            confidence=cls_res["confidence"],
            categoryReasoning=cls_res["reasoning"],
            suggestedPriority=pri_res["priority"],
            priorityReasoning=pri_res["reasoning"],
            summary=analysis["summary"],
        )

    @staticmethod
    def create_incident(db: Session, user_id: int, request: CreateIncidentRequest) -> IncidentResponse:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException("User not found")

        analysis = AiTextAnalysisService.analyze_incident(request.description)
        cls_res = analysis["classification"]
        pri_res = analysis["priority"]

        report = IncidentReport(
            user_id=user_id,
            description=request.description.strip(),
            category=request.category,
            priority=pri_res["priority"],
            ai_suggested_category=cls_res["category"],
            ai_suggested_priority=pri_res["priority"],
            ai_confidence=cls_res["confidence"],
            ai_reasoning=f"{cls_res['reasoning']}; {pri_res['reasoning']}",
            ai_summary=analysis["summary"],
            lat=request.lat,
            lng=request.lng,
            area_label=request.areaLabel.strip() if request.areaLabel else None,
            visibility_type=request.visibilityType or IncidentVisibilityEnum.ANON_PUBLIC.value,
            status=IncidentStatusEnum.SUBMITTED.value,
        )
        db.add(report)
        db.flush()

        AuditService.record(
            db,
            user_id,
            "INCIDENT_CREATED",
            "INCIDENT_REPORT",
            report.id,
            f"AI suggested {cls_res['category']}/{pri_res['priority']}",
        )
        db.commit()
        db.refresh(report)
        return IncidentService.to_response(report)

    @staticmethod
    def get_my_incidents(db: Session, user_id: int) -> List[IncidentResponse]:
        reports = (
            db.query(IncidentReport)
            .filter(IncidentReport.user_id == user_id)
            .order_by(IncidentReport.created_at.desc())
            .all()
        )
        return [IncidentService.to_response(r) for r in reports]

    @staticmethod
    def get_all_incidents(
        db: Session,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 0,
        size: int = 20,
    ) -> PageResponse[IncidentAdminResponse]:
        query = db.query(IncidentReport)
        if category and category.strip():
            query = query.filter(IncidentReport.category == category.strip())
        if priority and priority.strip():
            query = query.filter(IncidentReport.priority == priority.strip())
        if status and status.strip():
            query = query.filter(IncidentReport.status == status.strip())

        total = query.count()
        total_pages = math.ceil(total / size) if size > 0 else 0
        items = (
            query.order_by(IncidentReport.created_at.desc())
            .offset(page * size)
            .limit(size)
            .all()
        )
        content = [IncidentService.to_admin_response(r) for r in items]
        return PageResponse(
            content=content,
            page=page,
            size=size,
            totalElements=total,
            totalPages=total_pages,
            last=(page + 1 >= total_pages) if total_pages > 0 else True,
        )

    @staticmethod
    def review_incident(
        db: Session,
        reviewer_user_id: int,
        incident_id: int,
        request: ReviewIncidentRequest,
    ) -> IncidentAdminResponse:
        report = db.query(IncidentReport).filter(IncidentReport.id == incident_id).first()
        if not report:
            raise ResourceNotFoundException("Incident report not found")

        if request.category and request.category != report.category:
            AuditService.record(
                db,
                reviewer_user_id,
                "INCIDENT_CATEGORY_OVERRIDDEN",
                "INCIDENT_REPORT",
                report.id,
                f"{report.category} -> {request.category}",
            )
            report.category = request.category

        if request.priority and request.priority != report.priority:
            AuditService.record(
                db,
                reviewer_user_id,
                "INCIDENT_PRIORITY_OVERRIDDEN",
                "INCIDENT_REPORT",
                report.id,
                f"{report.priority} -> {request.priority}",
            )
            report.priority = request.priority

        if request.status:
            report.status = request.status

        if request.assignedToUserId is not None:
            assignee = db.query(User).filter(User.id == request.assignedToUserId).first()
            if not assignee:
                raise ResourceNotFoundException("Assignee not found")
            report.assigned_to_id = assignee.id
            AuditService.record(
                db,
                reviewer_user_id,
                "INCIDENT_ASSIGNED",
                "INCIDENT_REPORT",
                report.id,
                f"Assigned to {assignee.name}",
            )
            if not request.status:
                report.status = IncidentStatusEnum.ASSIGNED.value

        reviewer = db.query(User).filter(User.id == reviewer_user_id).first()
        if not reviewer:
            raise ResourceNotFoundException("User not found")
        report.reviewed_by_id = reviewer.id
        report.reviewed_at = datetime.now()

        db.commit()
        db.refresh(report)
        return IncidentService.to_admin_response(report)

    @staticmethod
    def to_response(r: IncidentReport) -> IncidentResponse:
        return IncidentResponse(
            id=r.id,
            description=r.description,
            category=r.category,
            priority=r.priority,
            aiSuggestedCategory=r.ai_suggested_category,
            aiSuggestedPriority=r.ai_suggested_priority,
            aiConfidence=r.ai_confidence,
            areaLabel=r.area_label,
            visibilityType=r.visibility_type,
            status=r.status,
            createdAt=r.created_at,
        )

    @staticmethod
    def to_admin_response(r: IncidentReport) -> IncidentAdminResponse:
        reporter_name = (
            r.user.name
            if (r.visibility_type == IncidentVisibilityEnum.NAMED_ADMIN_ONLY.value and r.user)
            else None
        )
        return IncidentAdminResponse(
            id=r.id,
            reporterName=reporter_name,
            description=r.description,
            aiSummary=r.ai_summary,
            category=r.category,
            priority=r.priority,
            aiSuggestedCategory=r.ai_suggested_category,
            aiSuggestedPriority=r.ai_suggested_priority,
            aiConfidence=r.ai_confidence,
            aiReasoning=r.ai_reasoning,
            assignedToName=r.assigned_to.name if r.assigned_to else None,
            lat=r.lat,
            lng=r.lng,
            areaLabel=r.area_label,
            visibilityType=r.visibility_type,
            status=r.status,
            createdAt=r.created_at,
        )
