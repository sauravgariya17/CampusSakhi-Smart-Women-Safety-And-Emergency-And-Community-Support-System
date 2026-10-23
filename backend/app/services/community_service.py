import math
from typing import Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.exceptions.handlers import BadRequestException, ResourceNotFoundException
from app.models.entities import (
    Comment,
    CommunityPost,
    ModerationQueueItem,
    ModerationQueueStatusEnum,
    ModerationStatusEnum,
    ReportSourceEnum,
    TargetTypeEnum,
    User,
    Vote,
)
from app.schemas.common import PageResponse
from app.schemas.community import (
    CommentResponse,
    CreateCommentRequest,
    CreatePostRequest,
    PostDetailResponse,
    PostSummaryResponse,
    ReportContentRequest,
)
from app.services.ai_service import AiTextAnalysisService

EXCERPT_LENGTH = 200

class CommunityService:
    @staticmethod
    def get_my_vote(db: Session, user_id: Optional[int], target_type: str, target_id: int) -> int:
        if not user_id:
            return 0
        vote = (
            db.query(Vote)
            .filter(
                Vote.user_id == user_id,
                Vote.target_type == target_type,
                Vote.target_id == target_id,
            )
            .first()
        )
        return vote.vote_value if vote else 0

    @staticmethod
    def create_post(db: Session, author_user_id: int, request: CreatePostRequest) -> PostDetailResponse:
        author = db.query(User).filter(User.id == author_user_id).first()
        if not author:
            raise ResourceNotFoundException("User not found")

        moderation = AiTextAnalysisService.analyze_moderation(
            f"{request.title} {request.body}", author_user_id, db
        )
        status = (
            ModerationStatusEnum.PENDING_REVIEW.value
            if moderation["should_queue"]
            else ModerationStatusEnum.PUBLISHED.value
        )

        post = CommunityPost(
            author_user_id=author.id,
            anonymous_handle_snapshot=author.anonymous_handle,
            title=request.title.strip(),
            body=request.body.strip(),
            category=request.category,
            area_label=request.areaLabel.strip() if request.areaLabel else None,
            moderation_status=status,
        )
        db.add(post)
        db.flush()

        if moderation["should_queue"]:
            queue_item = ModerationQueueItem(
                target_type=TargetTypeEnum.POST.value,
                target_id=post.id,
                reason=moderation["reasoning"],
                flagged_by=ReportSourceEnum.AI.value,
                status=ModerationQueueStatusEnum.PENDING.value,
            )
            db.add(queue_item)

        db.commit()
        db.refresh(post)
        return CommunityService.to_detail_response(db, post, author_user_id)

    @staticmethod
    def get_feed(
        db: Session,
        caller_user_id: int,
        category: Optional[str] = None,
        keyword: Optional[str] = None,
        sort: str = "new",
        page: int = 0,
        size: int = 10,
    ) -> PageResponse[PostSummaryResponse]:
        query = db.query(CommunityPost).filter(
            CommunityPost.moderation_status == ModerationStatusEnum.PUBLISHED.value
        )
        if category and category.strip():
            query = query.filter(CommunityPost.category == category.strip())
        if keyword and keyword.strip():
            kw = f"%{keyword.strip()}%"
            query = query.filter(
                or_(CommunityPost.title.ilike(kw), CommunityPost.body.ilike(kw))
            )

        if sort and sort.lower() == "top":
            query = query.order_by(CommunityPost.upvote_count.desc(), CommunityPost.created_at.desc())
        else:
            query = query.order_by(CommunityPost.created_at.desc())

        total = query.count()
        total_pages = math.ceil(total / size) if size > 0 else 0
        posts = query.offset(page * size).limit(size).all()

        content = [CommunityService.to_summary_response(db, p, caller_user_id) for p in posts]
        return PageResponse(
            content=content,
            page=page,
            size=size,
            totalElements=total,
            totalPages=total_pages,
            last=(page + 1 >= total_pages) if total_pages > 0 else True,
        )

    @staticmethod
    def get_post_detail(db: Session, caller_user_id: int, post_id: int) -> PostDetailResponse:
        post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise ResourceNotFoundException("Post not found")

        if (
            post.moderation_status != ModerationStatusEnum.PUBLISHED.value
            and post.author_user_id != caller_user_id
        ):
            raise ResourceNotFoundException("Post not found")

        return CommunityService.to_detail_response(db, post, caller_user_id)

    @staticmethod
    def add_comment(
        db: Session, author_user_id: int, post_id: int, request: CreateCommentRequest
    ) -> CommentResponse:
        post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post or post.moderation_status != ModerationStatusEnum.PUBLISHED.value:
            raise ResourceNotFoundException("Post not found")

        author = db.query(User).filter(User.id == author_user_id).first()
        if not author:
            raise ResourceNotFoundException("User not found")

        moderation = AiTextAnalysisService.analyze_moderation(request.body, author_user_id, db)
        status = (
            ModerationStatusEnum.PENDING_REVIEW.value
            if moderation["should_queue"]
            else ModerationStatusEnum.PUBLISHED.value
        )

        comment = Comment(
            post_id=post.id,
            author_user_id=author.id,
            anonymous_handle_snapshot=author.anonymous_handle,
            body=request.body.strip(),
            moderation_status=status,
        )
        db.add(comment)
        db.flush()

        if moderation["should_queue"]:
            queue_item = ModerationQueueItem(
                target_type=TargetTypeEnum.COMMENT.value,
                target_id=comment.id,
                reason=moderation["reasoning"],
                flagged_by=ReportSourceEnum.AI.value,
                status=ModerationQueueStatusEnum.PENDING.value,
            )
            db.add(queue_item)
        else:
            post.comment_count = (post.comment_count or 0) + 1

        db.commit()
        db.refresh(comment)
        return CommunityService.to_comment_response(db, comment, author_user_id)

    @staticmethod
    def get_comments(
        db: Session, caller_user_id: int, post_id: int, page: int = 0, size: int = 20
    ) -> PageResponse[CommentResponse]:
        exists = db.query(CommunityPost.id).filter(CommunityPost.id == post_id).first()
        if not exists:
            raise ResourceNotFoundException("Post not found")

        query = (
            db.query(Comment)
            .filter(
                Comment.post_id == post_id,
                Comment.moderation_status == ModerationStatusEnum.PUBLISHED.value,
            )
            .order_by(Comment.created_at.asc())
        )
        total = query.count()
        total_pages = math.ceil(total / size) if size > 0 else 0
        comments = query.offset(page * size).limit(size).all()

        content = [CommunityService.to_comment_response(db, c, caller_user_id) for c in comments]
        return PageResponse(
            content=content,
            page=page,
            size=size,
            totalElements=total,
            totalPages=total_pages,
            last=(page + 1 >= total_pages) if total_pages > 0 else True,
        )

    @staticmethod
    def cast_vote(db: Session, user_id: int, target_type: str, target_id: int, vote_value: int) -> int:
        if target_type == TargetTypeEnum.POST.value:
            target = db.query(CommunityPost).filter(CommunityPost.id == target_id).first()
            if not target:
                raise ResourceNotFoundException("POST not found")
        else:
            target = db.query(Comment).filter(Comment.id == target_id).first()
            if not target:
                raise ResourceNotFoundException("COMMENT not found")

        existing = (
            db.query(Vote)
            .filter(
                Vote.user_id == user_id,
                Vote.target_type == target_type,
                Vote.target_id == target_id,
            )
            .first()
        )

        if existing:
            if vote_value == 0 or existing.vote_value == vote_value:
                db.delete(existing)
                resulting_vote = 0
            else:
                existing.vote_value = vote_value
                resulting_vote = vote_value
        elif vote_value != 0:
            new_vote = Vote(
                user_id=user_id,
                target_type=target_type,
                target_id=target_id,
                vote_value=vote_value,
            )
            db.add(new_vote)
            resulting_vote = vote_value
        else:
            resulting_vote = 0

        db.flush()

        upvotes = (
            db.query(Vote)
            .filter(
                Vote.target_type == target_type,
                Vote.target_id == target_id,
                Vote.vote_value == 1,
            )
            .count()
        )
        downvotes = (
            db.query(Vote)
            .filter(
                Vote.target_type == target_type,
                Vote.target_id == target_id,
                Vote.vote_value == -1,
            )
            .count()
        )
        target.upvote_count = upvotes
        target.downvote_count = downvotes

        db.commit()
        return resulting_vote

    @staticmethod
    def report_content(db: Session, reporter_user_id: int, request: ReportContentRequest) -> None:
        target_type = request.targetType.upper()
        if target_type == TargetTypeEnum.POST.value:
            exists = db.query(CommunityPost.id).filter(CommunityPost.id == request.targetId).first()
        elif target_type == TargetTypeEnum.COMMENT.value:
            exists = db.query(Comment.id).filter(Comment.id == request.targetId).first()
        else:
            raise BadRequestException("targetType must be POST or COMMENT")

        if not exists:
            raise ResourceNotFoundException(f"{target_type} not found")

        already = (
            db.query(ModerationQueueItem)
            .filter(
                ModerationQueueItem.target_type == target_type,
                ModerationQueueItem.target_id == request.targetId,
                ModerationQueueItem.reporter_user_id == reporter_user_id,
            )
            .first()
        )
        if already:
            raise BadRequestException("You have already reported this content")

        item = ModerationQueueItem(
            target_type=target_type,
            target_id=request.targetId,
            reason=request.reason.strip() if request.reason else None,
            flagged_by=ReportSourceEnum.USER.value,
            reporter_user_id=reporter_user_id,
            status=ModerationQueueStatusEnum.PENDING.value,
        )
        db.add(item)
        db.commit()

    @staticmethod
    def to_summary_response(db: Session, post: CommunityPost, caller_user_id: int) -> PostSummaryResponse:
        body = post.body or ""
        excerpt = body[:EXCERPT_LENGTH] + "..." if len(body) > EXCERPT_LENGTH else body
        return PostSummaryResponse(
            id=post.id,
            anonymousHandle=post.anonymous_handle_snapshot,
            title=post.title,
            excerpt=excerpt,
            category=post.category,
            areaLabel=post.area_label,
            upvoteCount=post.upvote_count,
            downvoteCount=post.downvote_count,
            commentCount=post.comment_count,
            myVote=CommunityService.get_my_vote(db, caller_user_id, TargetTypeEnum.POST.value, post.id),
            createdAt=post.created_at,
        )

    @staticmethod
    def to_detail_response(db: Session, post: CommunityPost, caller_user_id: int) -> PostDetailResponse:
        return PostDetailResponse(
            id=post.id,
            anonymousHandle=post.anonymous_handle_snapshot,
            title=post.title,
            body=post.body,
            category=post.category,
            areaLabel=post.area_label,
            upvoteCount=post.upvote_count,
            downvoteCount=post.downvote_count,
            commentCount=post.comment_count,
            myVote=CommunityService.get_my_vote(db, caller_user_id, TargetTypeEnum.POST.value, post.id),
            createdAt=post.created_at,
        )

    @staticmethod
    def to_comment_response(db: Session, comment: Comment, caller_user_id: int) -> CommentResponse:
        return CommentResponse(
            id=comment.id,
            anonymousHandle=comment.anonymous_handle_snapshot,
            body=comment.body,
            upvoteCount=comment.upvote_count,
            downvoteCount=comment.downvote_count,
            myVote=CommunityService.get_my_vote(db, caller_user_id, TargetTypeEnum.COMMENT.value, comment.id),
            createdAt=comment.created_at,
        )
