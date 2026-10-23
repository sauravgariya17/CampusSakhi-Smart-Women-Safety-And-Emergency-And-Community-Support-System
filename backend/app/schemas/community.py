from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CreatePostRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    body: str = Field(..., min_length=10, max_length=5000)
    category: str
    areaLabel: Optional[str] = Field(None, max_length=120)

class CreateCommentRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)

class VoteRequest(BaseModel):
    voteValue: int = Field(..., ge=-1, le=1)

class ReportContentRequest(BaseModel):
    targetType: str = Field(..., description="POST or COMMENT")
    targetId: int
    reason: Optional[str] = Field(None, max_length=500)

class PostSummaryResponse(BaseModel):
    id: int
    anonymousHandle: str
    title: str
    excerpt: str
    category: Optional[str] = None
    areaLabel: Optional[str] = None
    upvoteCount: int = 0
    downvoteCount: int = 0
    commentCount: int = 0
    myVote: int = 0
    createdAt: datetime

    model_config = {"from_attributes": True}

class PostDetailResponse(BaseModel):
    id: int
    anonymousHandle: str
    title: str
    body: str
    category: Optional[str] = None
    areaLabel: Optional[str] = None
    upvoteCount: int = 0
    downvoteCount: int = 0
    commentCount: int = 0
    myVote: int = 0
    createdAt: datetime

    model_config = {"from_attributes": True}

class CommentResponse(BaseModel):
    id: int
    anonymousHandle: str
    body: str
    upvoteCount: int = 0
    downvoteCount: int = 0
    myVote: int = 0
    createdAt: datetime

    model_config = {"from_attributes": True}
