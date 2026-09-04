import contextvars
import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Contextual variables for correlation tracking across async coroutines & background workers
ctx_request_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("ctx_request_id", default=None)
ctx_tenant_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("ctx_tenant_id", default=None)
ctx_agent_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("ctx_agent_id", default=None)


class JSONFormatter(logging.Formatter):
    """
    Format logs as JSON objects for structured logging and distributed observability.
    Automatically enriches logs with contextual correlation IDs from contextvars.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Contextual correlation IDs (record attribute or contextvar fallback)
        req_id = getattr(record, "request_id", None) or ctx_request_id.get()
        if req_id:
            log_data["request_id"] = req_id

        tenant_id = getattr(record, "tenant_id", None) or ctx_tenant_id.get()
        if tenant_id:
            log_data["tenant_id"] = tenant_id

        agent_id = getattr(record, "agent_id", None) or ctx_agent_id.get()
        if agent_id:
            log_data["agent_id"] = agent_id

        if hasattr(record, "latency_ms"):
            log_data["latency_ms"] = record.latency_ms

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configures root logger with JSON formatting."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers on reload
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        root_logger.addHandler(handler)

    return root_logger


logger = setup_logging()
