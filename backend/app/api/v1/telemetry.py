"""
Telemetry API
=============
Exposes in-process route performance statistics accumulated by
ObservabilityMiddleware — no external Prometheus/Grafana required.

Endpoints:
  GET  /telemetry/stats   - Per-route request count, error rate, avg/p50/p95/p99 latency
  POST /telemetry/reset   - Clear all accumulated stats (useful in tests / after deploy)
"""
from fastapi import APIRouter
from backend.app.core.observability import get_telemetry_snapshot, _TELEMETRY_REGISTRY, _TELEMETRY_LOCK

router = APIRouter()


@router.get(
    "/stats",
    summary="Live per-route performance telemetry"
)
async def get_stats():
    """
    Returns per-route latency percentiles and error rates accumulated since
    the last server restart (or manual reset).

    Fields per route:
      - requests:       total request count
      - errors:         5xx response count
      - error_rate_pct: percentage of requests that resulted in a 5xx error
      - avg_ms:         mean latency in milliseconds
      - p50_ms:         50th percentile latency (median)
      - p95_ms:         95th percentile latency
      - p99_ms:         99th percentile latency
    """
    snapshot = get_telemetry_snapshot()
    return {
        "total_routes_tracked": len(snapshot),
        "routes": snapshot
    }


@router.post(
    "/reset",
    summary="Reset all telemetry counters"
)
async def reset_stats():
    """Clears all accumulated telemetry — useful after deployments or in load tests."""
    with _TELEMETRY_LOCK:
        _TELEMETRY_REGISTRY.clear()
    return {"message": "Telemetry counters reset successfully."}
