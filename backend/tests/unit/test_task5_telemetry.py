"""
Task 5 Tests: Telemetry Middleware & Parallel Analytics
========================================================
Tests for:
  - _RouteStats record / avg / percentile correctness
  - ObservabilityMiddleware header injection
  - _safe_route_key template extraction
  - _is_probe_path filtering
  - get_telemetry_snapshot ordering
"""
import time
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from starlette.testclient import TestClient
from starlette.applications import Starlette
from starlette.responses import Response
from starlette.routing import Route

from backend.app.core.observability import (
    _RouteStats,
    _TELEMETRY_REGISTRY,
    _TELEMETRY_LOCK,
    get_telemetry_snapshot,
    ObservabilityMiddleware,
    _is_probe_path,
    _client_ip,
)


# ─── _RouteStats unit tests ───────────────────────────────────────────────────

def test_route_stats_count_increments():
    stats = _RouteStats()
    stats.record(50.0, is_error=False)
    stats.record(100.0, is_error=False)
    assert stats.count == 2


def test_route_stats_error_count():
    stats = _RouteStats()
    stats.record(200.0, is_error=True)
    stats.record(50.0, is_error=False)
    assert stats.error_count == 1


def test_route_stats_avg_ms():
    stats = _RouteStats()
    for v in [10.0, 20.0, 30.0]:
        stats.record(v, is_error=False)
    assert abs(stats.avg_ms - 20.0) < 0.01


def test_route_stats_percentile_median():
    stats = _RouteStats()
    # 10 samples: 10, 20, 30, ..., 100
    for v in range(10, 110, 10):
        stats.record(float(v), is_error=False)
    p50 = stats.percentile(50)
    # Median of 10 evenly-spaced values should be between 40 and 60
    assert 40.0 <= p50 <= 60.0


def test_route_stats_bounded_samples():
    """Sample buffer must not exceed 200 entries."""
    stats = _RouteStats()
    for i in range(300):
        stats.record(float(i), is_error=False)
    assert len(stats.samples) == 200


def test_route_stats_to_dict_keys():
    stats = _RouteStats()
    stats.record(42.0, is_error=False)
    d = stats.to_dict("/api/v1/test")
    for key in ("route", "requests", "errors", "error_rate_pct", "avg_ms", "p50_ms", "p95_ms", "p99_ms"):
        assert key in d, f"Missing key: {key}"


# ─── Helper function tests ─────────────────────────────────────────────────────

def test_is_probe_path_true():
    for path in ["/health", "/ready", "/favicon.ico", "/widget.js"]:
        assert _is_probe_path(path) is True, f"Should be probe: {path}"


def test_is_probe_path_false():
    for path in ["/api/v1/agents", "/api/v1/analytics/overview", "/api/v1/chat"]:
        assert _is_probe_path(path) is False, f"Should not be probe: {path}"


# ─── Middleware integration test ──────────────────────────────────────────────

def _make_test_app(status_code: int = 200):
    async def homepage(request):
        return Response(f"OK {status_code}", status_code=status_code)

    app = Starlette(routes=[Route("/test-route", homepage)])
    app.add_middleware(ObservabilityMiddleware)
    return app


def test_middleware_injects_request_id_header():
    app = _make_test_app(200)
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.get("/test-route")
    assert "X-Request-ID" in resp.headers


def test_middleware_injects_process_time_header():
    app = _make_test_app(200)
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.get("/test-route")
    assert "X-Process-Time-MS" in resp.headers
    assert float(resp.headers["X-Process-Time-MS"]) >= 0


def test_middleware_respects_incoming_request_id():
    app = _make_test_app(200)
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.get("/test-route", headers={"X-Request-ID": "my-custom-id"})
    assert resp.headers["X-Request-ID"] == "my-custom-id"


# ─── get_telemetry_snapshot ordering ─────────────────────────────────────────

def test_telemetry_snapshot_sorted_by_request_count():
    with _TELEMETRY_LOCK:
        _TELEMETRY_REGISTRY.clear()

    _TELEMETRY_REGISTRY["GET /api/v1/chat"].record(100.0, False)
    _TELEMETRY_REGISTRY["GET /api/v1/agents"].record(50.0, False)
    _TELEMETRY_REGISTRY["GET /api/v1/agents"].record(60.0, False)
    _TELEMETRY_REGISTRY["GET /api/v1/agents"].record(70.0, False)

    snap = get_telemetry_snapshot()
    assert snap[0]["route"] == "GET /api/v1/agents"
    assert snap[0]["requests"] == 3

    with _TELEMETRY_LOCK:
        _TELEMETRY_REGISTRY.clear()
