import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract or generate Request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.perf_counter()

        response = await call_next(request)

        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-MS"] = str(process_time_ms)

        # Log request summary
        logger.info(
            f"{request.method} {request.url.path} - Status: {response.status_code} - {process_time_ms}ms",
            extra={
                "request_id": request_id,
                "latency_ms": process_time_ms,
                "status_code": response.status_code,
                "path": request.url.path,
                "method": request.method
            }
        )

        return response
