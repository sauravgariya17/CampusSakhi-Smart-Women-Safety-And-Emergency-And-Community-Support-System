from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import TargetTypeEnum, User
from app.schemas.common import ApiResponse, PageResponse
from app.schemas.community import (
    CommentResponse,
    CreateCommentRequest,
    CreatePostRequest,
    PostDetailResponse,
    PostSummaryResponse,
    ReportContentRequest,
    VoteRequest,
)
from app.services.community_service import CommunityService

router = APIRouter()

@router.post("/posts", response_model=ApiResponse[PostDetailResponse], status_code=status.HTTP_201_CREATED)
def create_post(
    request: CreatePostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = CommunityService.create_post(db, current_user.id, request)
    return ApiResponse(success=True, message="Post created", data=data)

@router.get("/posts", response_model=ApiResponse[PageResponse[PostSummaryResponse]])
def get_feed(
    category: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    sort: str = Query("new"),
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = CommunityService.get_feed(db, current_user.id, category, keyword, sort, page, size)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.get("/posts/{post_id}", response_model=ApiResponse[PostDetailResponse])
def get_post_detail(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = CommunityService.get_post_detail(db, current_user.id, post_id)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post(
    "/posts/{post_id}/comments",
    response_model=ApiResponse[CommentResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    post_id: int,
    request: CreateCommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = CommunityService.add_comment(db, current_user.id, post_id, request)
    return ApiResponse(success=True, message="Comment added", data=data)

@router.get("/posts/{post_id}/comments", response_model=ApiResponse[PageResponse[CommentResponse]])
def get_comments(
    post_id: int,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = CommunityService.get_comments(db, current_user.id, post_id, page, size)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post("/posts/{post_id}/vote", response_model=ApiResponse[int])
def vote_post(
    post_id: int,
    request: VoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = CommunityService.cast_vote(
        db, current_user.id, TargetTypeEnum.POST.value, post_id, request.voteValue
    )
    return ApiResponse(success=True, message="Vote recorded", data=result)

@router.post("/comments/{comment_id}/vote", response_model=ApiResponse[int])
def vote_comment(
    comment_id: int,
    request: VoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = CommunityService.cast_vote(
        db, current_user.id, TargetTypeEnum.COMMENT.value, comment_id, request.voteValue
    )
    return ApiResponse(success=True, message="Vote recorded", data=result)

@router.post("/report", response_model=ApiResponse[None])
def report_content(
    request: ReportContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    CommunityService.report_content(db, current_user.id, request)
    return ApiResponse(success=True, message="Report submitted for moderator review", data=None)
