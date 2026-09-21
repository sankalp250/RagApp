"""
Circuit Breaker Pattern for External AI & LLM Providers
========================================================
Protects the application from cascading failures when an external AI API
(e.g., Gemini, Groq, OpenAI) is down, timing out, or rate-limited.

States:
  - CLOSED: Normal operation. All calls pass through.
  - OPEN: Tripped after failure_threshold errors. Calls immediately fail or route to fallback.
  - HALF_OPEN: After recovery_timeout, allows a canary request to test provider health.
"""
import time
import asyncio
from enum import Enum
from typing import Callable, Any, Optional
from backend.app.core.logging import logger


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerOpenException(Exception):
    """Raised when an operation is attempted on an open circuit."""
    pass


class CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: float = 30.0,
        call_timeout: float = 15.0
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.call_timeout = call_timeout

        self.state: CircuitState = CircuitState.CLOSED
        self.failure_count: int = 0
        self.last_failure_time: float = 0.0
        self.last_state_change: float = time.monotonic()
        self._lock = asyncio.Lock()

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Executes an async function through the circuit breaker with timeout."""
        async with self._lock:
            now = time.monotonic()

            # Check if circuit should transition from OPEN to HALF_OPEN
            if self.state == CircuitState.OPEN:
                if now - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.info(f"CircuitBreaker [{self.name}] entering HALF_OPEN state (canary trial).")
                else:
                    raise CircuitBreakerOpenException(
                        f"CircuitBreaker [{self.name}] is OPEN. Fast-failing request."
                    )

        # Execute call with timeout
        try:
            result = await asyncio.wait_for(func(*args, **kwargs), timeout=self.call_timeout)
            await self._on_success()
            return result
        except asyncio.TimeoutError as e:
            logger.error(f"CircuitBreaker [{self.name}] timed out after {self.call_timeout}s.")
            await self._on_failure(e)
            raise TimeoutError(f"Provider [{self.name}] timed out.")
        except Exception as e:
            logger.error(f"CircuitBreaker [{self.name}] execution error: {e}")
            await self._on_failure(e)
            raise

    async def call_stream(self, stream_fn: Callable, *args, **kwargs):
        """Executes an async generator through the circuit breaker with failure tracking."""
        async with self._lock:
            now = time.monotonic()
            if self.state == CircuitState.OPEN:
                if now - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.info(f"CircuitBreaker [{self.name}] entering HALF_OPEN state (canary trial).")
                else:
                    raise CircuitBreakerOpenException(
                        f"CircuitBreaker [{self.name}] is OPEN. Fast-failing stream."
                    )

        try:
            gen = stream_fn(*args, **kwargs)
            async for item in gen:
                yield item
            await self._on_success()
        except Exception as e:
            logger.error(f"CircuitBreaker [{self.name}] stream execution error: {e}")
            await self._on_failure(e)
            raise

    async def _on_success(self):
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                logger.info(f"CircuitBreaker [{self.name}] recovered! Transitioning to CLOSED.")
            self.failure_count = 0
            self.state = CircuitState.CLOSED

    async def _on_failure(self, exc: Optional[Exception] = None):
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.monotonic()
            err_str = str(exc or "").lower()
            is_fatal_auth = any(k in err_str for k in ["401", "authenticationerror", "incorrect api key", "unauthorized"])
            is_quota = any(k in err_str for k in ["429", "resource_exhausted", "resourceexhausted", "quota"])

            if is_fatal_auth:
                self.failure_count = self.failure_threshold
                self.state = CircuitState.OPEN
                self.recovery_timeout = 3600.0  # Cool off bad credentials
                logger.warning(f"CircuitBreaker [{self.name}] immediately tripped to OPEN due to auth failure.")
            elif is_quota:
                self.failure_count = self.failure_threshold
                self.state = CircuitState.OPEN
                self.recovery_timeout = 60.0    # Cool off quota exhaustion for 60s
                logger.warning(f"CircuitBreaker [{self.name}] immediately tripped to OPEN due to quota limit.")
            elif self.state == CircuitState.HALF_OPEN or self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                logger.warning(
                    f"CircuitBreaker [{self.name}] tripped to OPEN after {self.failure_count} failures."
                )


# Global Circuit Breakers for AI providers
gemini_breaker = CircuitBreaker(name="gemini_llm", failure_threshold=3, recovery_timeout=30.0, call_timeout=15.0)
openai_breaker = CircuitBreaker(name="openai_llm", failure_threshold=3, recovery_timeout=30.0, call_timeout=15.0)
groq_breaker = CircuitBreaker(name="groq_llm", failure_threshold=3, recovery_timeout=30.0, call_timeout=15.0)

