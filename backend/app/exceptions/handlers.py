from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, errors: Optional[List[str]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors

class ResourceNotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)

class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)

class DuplicateResourceException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status.HTTP_409_CONFLICT)

class OutOfScopeException(AppException):
    def __init__(self, message: str = "Location out of campus scope"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)

def build_error_payload(message: str, status_code: int, errors: Optional[List[str]] = None) -> dict:
    return {
        "success": False,
        "message": message,
        "status": status_code,
        "timestamp": datetime.now().isoformat(),
        "errors": errors,
    }

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_payload(exc.message, exc.status_code, exc.errors),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_payload(detail, exc.status_code),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []) if x != "body")
            msg = err.get("msg", "Invalid value")
            if msg.startswith("Value error, "):
                msg = msg.replace("Value error, ", "", 1)
            errors.append(f"{loc}: {msg}" if loc else msg)
        first_msg = errors[0] if errors else "Validation failed"
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=build_error_payload(first_msg, status.HTTP_400_BAD_REQUEST, errors),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=build_error_payload("An unexpected server error occurred", status.HTTP_500_INTERNAL_SERVER_ERROR),
        )
