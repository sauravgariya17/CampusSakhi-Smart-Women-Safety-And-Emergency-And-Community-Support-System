from datetime import datetime
import math
from sqlalchemy.orm import Session

from app.exceptions.handlers import BadRequestException, ResourceNotFoundException
from app.models.entities import (
    Comment,
    CommunityPost,
    ModerationQueueItem,
    ModerationQueueStatusEnum,
    ModerationStatusEnum,
    TargetTypeEnum,
    User,
)
from app.schemas.common import PageResponse
from app.schemas.moderation import ModerationQueueItemResponse, ModerationReviewRequest

PREVIEW_LENGTH = 150

class ModerationService:
    @staticmethod
    def get_pending_queue(
        db: Session, page: int = 0, size: int = 20
    ) -> PageResponse[ModerationQueueItemResponse]:
        query = (
            db.query(ModerationQueueItem)
            .filter(ModerationQueueItem.status == ModerationQueueStatusEnum.PENDING.value)
            .order_by(ModerationQueueItem.created_at.asc())
        )
        total = query.count()
        total_pages = math.ceil(total / size) if size > 0 else 0
        items = query.offset(page * size).limit(size).all()

        content = [ModerationService._to_response(db, item) for item in items]
        return PageResponse(
            content=content,
            page=page,
            size=size,
            totalElements=total,
            totalPages=total_pages,
            last=(page + 1 >= total_pages) if total_pages > 0 else True,
        )

    @staticmethod
    def review_item(
        db: Session, moderator_user_id: int, queue_id: int, request: ModerationReviewRequest
    ) -> None:
        item = db.query(ModerationQueueItem).filter(ModerationQueueItem.id == queue_id).first()
        if not item:
            raise ResourceNotFoundException("Queue item not found")

        decision = request.decision.upper()
        if decision not in (
            ModerationQueueStatusEnum.APPROVED.value,
            ModerationQueueStatusEnum.REMOVED.value,
        ):
            raise BadRequestException("Decision must be APPROVED or REMOVED")

        moderator = db.query(User).filter(User.id == moderator_user_id).first()
        if not moderator:
            raise ResourceNotFoundException("User not found")

        item.status = decision
        item.reviewed_by_id = moderator.id
        item.reviewed_at = datetime.now()

        new_content_status = (
            ModerationStatusEnum.PUBLISHED.value
            if decision == ModerationQueueStatusEnum.APPROVED.value
            else ModerationStatusEnum.REMOVED.value
        )

        if item.target_type == TargetTypeEnum.POST.value:
            post = db.query(CommunityPost).filter(CommunityPost.id == item.target_id).first()
            if not post:
                raise ResourceNotFoundException("Post not found")
            post.moderation_status = new_content_status
        else:
            comment = db.query(Comment).filter(Comment.id == item.target_id).first()
            if not comment:
                raise ResourceNotFoundException("Comment not found")
            prev_status = comment.moderation_status
            comment.moderation_status = new_content_status
            if new_content_status == ModerationStatusEnum.REMOVED.value and prev_status == ModerationStatusEnum.PUBLISHED.value:
                if comment.post:
                    comment.post.comment_count = max(0, (comment.post.comment_count or 0) - 1)
            elif new_content_status == ModerationStatusEnum.PUBLISHED.value and prev_status != ModerationStatusEnum.PUBLISHED.value:
                if comment.post:
                    comment.post.comment_count = (comment.post.comment_count or 0) + 1

        db.commit()

    @staticmethod
    def _to_response(db: Session, item: ModerationQueueItem) -> ModerationQueueItemResponse:
        if item.target_type == TargetTypeEnum.POST.value:
            post = db.query(CommunityPost).filter(CommunityPost.id == item.target_id).first()
            preview = (
                ModerationService._truncate(f"{post.title} - {post.body}")
                if post
                else "[content deleted]"
            )
            author_handle = post.anonymous_handle_snapshot if post else "unknown"
        else:
            comment = db.query(Comment).filter(Comment.id == item.target_id).first()
            preview = ModerationService._truncate(comment.body) if comment else "[content deleted]"
            author_handle = comment.anonymous_handle_snapshot if comment else "unknown"

        return ModerationQueueItemResponse(
            queueId=item.id,
            targetType=item.target_type,
            targetId=item.target_id,
            reason=item.reason,
            flaggedBy=item.flagged_by,
            status=item.status,
            contentPreview=preview,
            contentAuthorHandle=author_handle,
            createdAt=item.created_at,
        )

    @staticmethod
    def _truncate(text: str) -> str:
        return text[:PREVIEW_LENGTH] + "..." if len(text) > PREVIEW_LENGTH else text
