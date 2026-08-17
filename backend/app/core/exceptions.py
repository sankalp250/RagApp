from typing import Any, Optional, Dict


class DomainException(Exception):
    """
    Base domain exception with configurable HTTP status code.
    
    Used throughout domain services to signal domain-level failures that 
    get translated to proper HTTP status codes by the global exception handler in main.py.
    """
    status_code: int = 400

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
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
