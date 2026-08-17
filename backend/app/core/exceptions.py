from typing import Any, Optional, Dict


class DomainException(Exception):
    """Base domain exception with configurable HTTP status code."""
    status_code: int = 400

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class TenantNotFoundException(DomainException):
    status_code: int = 404


class TenantAccessDeniedException(DomainException):
    status_code: int = 403


class AgentNotFoundException(DomainException):
    status_code: int = 404


class DocumentNotFoundException(DomainException):
    status_code: int = 404


class AuthenticationFailedException(DomainException):
    status_code: int = 401


class InvalidCredentialsException(DomainException):
    status_code: int = 401


class RateLimitExceededException(DomainException):
    status_code: int = 429
