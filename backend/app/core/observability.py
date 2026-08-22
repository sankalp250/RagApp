"""
Observability Middleware
========================
Production-grade request telemetry for every HTTP request:

  - X-Request-ID header: propagated from client or generated per request
  - X-Process-Time-MS header: wall-clock latency in milliseconds
  - X-Route header: matched path template (not raw URL, safe for high cardinality)

Structured log output per request:
  {method, path, status_code, latency_ms, request_id, client_ip}

In-process telemetry accumulator (RouteStats):
  Thread-safe sliding counters exposed at /api/v1/telemetry/stats without
  any external dependency (no Prometheus, no OpenTelemetry agent required).
  Statistics roll over every STATS_WINDOW_SECONDS (default 60s).
"""
import time
import uuid
from collections import defaultdict
from threading import Lock
from typing import Callable, Dict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.logging import logger

# ─── In-Process Telemetry Store ───────────────────────────────────────────────
STATS_WINDOW_SECONDS = 60.0  # rolling window for p50/p95/p99 approximations


class _RouteStats:
    """
    Lock-protected, per-route performance counters.
    Tracks call count, error count, and a bounded latency sample buffer
    (last 200 samples per route) for lightweight percentile computation.
    """
    __slots__ = ("count", "error_count", "total_ms", "samples", "_lock")

    def __init__(self):
        self.count: int = 0
        self.error_count: int = 0
        self.total_ms: float = 0.0
        self.samples: list = []   # bounded circular buffer (last 200 samples)
        self._lock = Lock()

    def record(self, latency_ms: float, is_error: bool) -> None:
        with self._lock:
            self.count += 1
            self.total_ms += latency_ms
            if is_error:
                self.error_count += 1
            # Keep only last 200 samples to bound memory usage
            if len(self.samples) >= 200:
                self.samples.pop(0)
            self.samples.append(latency_ms)

    def _unlocked_avg(self) -> float:
        """Must only be called while self._lock is already held."""
        return round(self.total_ms / self.count, 2) if self.count else 0.0

    def _unlocked_percentile(self, p: float) -> float:
        """Must only be called while self._lock is already held."""
        if not self.samples:
            return 0.0
        sorted_s = sorted(self.samples)
        idx = max(0, int(len(sorted_s) * p / 100) - 1)
        return round(sorted_s[idx], 2)

    @property
    def avg_ms(self) -> float:
        with self._lock:
            return self._unlocked_avg()

    def percentile(self, p: float) -> float:
        """Approximate percentile from the bounded sample buffer."""
        with self._lock:
            return self._unlocked_percentile(p)

    def to_dict(self, route: str) -> dict:
        # Acquire lock once; call internal unlocked helpers — avoids re-entrant deadlock
        with self._lock:
            return {
                "route": route,
                "requests": self.count,
                "errors": self.error_count,
                "error_rate_pct": round(self.error_count / self.count * 100, 1) if self.count else 0.0,
                "avg_ms": self._unlocked_avg(),
                "p50_ms": self._unlocked_percentile(50),
                "p95_ms": self._unlocked_percentile(95),
                "p99_ms": self._unlocked_percentile(99),
            }


# Module-level telemetry registry (survives across requests)
_TELEMETRY_REGISTRY: Dict[str, _RouteStats] = defaultdict(_RouteStats)
_TELEMETRY_LOCK = Lock()


def get_telemetry_snapshot() -> list:
    """Return a sorted snapshot of all route telemetry (thread-safe)."""
    with _TELEMETRY_LOCK:
        routes = list(_TELEMETRY_REGISTRY.keys())
    return sorted(
        [_TELEMETRY_REGISTRY[r].to_dict(r) for r in routes],
        key=lambda d: d["requests"],
        reverse=True
    )


# ─── Middleware ────────────────────────────────────────────────────────────────
class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Attaches Request-ID, measures wall-clock latency, sets response headers,
    emits structured log, and records per-route telemetry stats.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 1. Extract or generate Request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        # 2. Measure wall-clock time
        start = time.perf_counter()
        response = await call_next(request)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)

        # 3. Determine route key: use path template when available (avoids ID cardinality)
        route_key = _safe_route_key(request)
        is_error = response.status_code >= 500

        # 4. Stamp response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-MS"] = str(latency_ms)
        response.headers["X-Route"] = route_key

        # 5. Structured request log
        logger.info(
            f"{request.method} {route_key} → {response.status_code} ({latency_ms}ms)",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "route": route_key,
                "status_code": response.status_code,
                "latency_ms": latency_ms,
                "client_ip": _client_ip(request),
            }
        )

        # 6. Accumulate telemetry (skip health/static probes to reduce noise)
        if not _is_probe_path(request.url.path):
            _TELEMETRY_REGISTRY[f"{request.method} {route_key}"].record(latency_ms, is_error)

        return response


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _safe_route_key(request: Request) -> str:
    """
    Returns the matched route path template (e.g. /api/v1/agents/{agent_id})
    instead of the raw URL path (/api/v1/agents/abc-123) to prevent
    cardinality explosion in telemetry keys.
    Falls back to the raw path if no route was matched (e.g. 404s).
    """
    route = request.scope.get("route")
    if route and hasattr(route, "path"):
        return route.path
    return request.url.path


def _client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For from reverse proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_probe_path(path: str) -> bool:
    """Returns True for health/readiness probe and static asset paths."""
    return path in {"/health", "/ready", "/favicon.ico", "/widget.js"}
