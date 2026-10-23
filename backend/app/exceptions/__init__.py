from app.exceptions.handlers import (
    AppException,
    ResourceNotFoundException,
    BadRequestException,
    DuplicateResourceException,
    OutOfScopeException,
    UnauthorizedException,
    ForbiddenException,
    register_exception_handlers,
)
