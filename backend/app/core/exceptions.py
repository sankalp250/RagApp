from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class DomainException(Exception):
    """Base domain exception."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class TenantNotFoundException(DomainException):
    pass


class TenantAccessDeniedException(DomainException):
    pass


class AgentNotFoundException(DomainException):
    pass


class DocumentNotFoundException(DomainException):
    pass


class AuthenticationFailedException(DomainException):
    pass


class InvalidCredentialsException(DomainException):
    pass


class RateLimitExceededException(DomainException):
    pass
