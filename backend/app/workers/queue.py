"""
Resilient Background Job Queue with Dead-Letter Queue (DLQ)
============================================================
Provides non-blocking background job scheduling with:
  - Bounded exponential backoff retries with jitter
  - Per-job execution timeout enforcement
  - Dead-Letter Queue (DLQ) capturing exhausted poison pills
  - In-process telemetry and DLQ operational introspection
"""
import asyncio
import random
import time
import traceback
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Any, Dict, List, Optional
from backend.app.core.logging import logger


@dataclass
class DeadLetterJob:
    job_id: str
    job_name: str
    error: str
    traceback: str
    attempts: int
    first_attempt_at: datetime
    failed_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


class ResilientJobQueue:
    """
    Production-grade asynchronous job queue dispatcher with automatic retry backoff,
    timeout protection, and Dead-Letter Queue (DLQ) capture.
    """
    def __init__(self, max_dlq_size: int = 500):
        self.max_dlq_size = max_dlq_size
        self._dlq: List[DeadLetterJob] = []
        self._lock = asyncio.Lock()
        self._jobs_processed: int = 0
        self._jobs_succeeded: int = 0
        self._jobs_failed: int = 0
        self._jobs_retried: int = 0

    def enqueue(
        self,
        coro_fn: Callable[..., Any],
        *args: Any,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        backoff_factor: float = 2.0,
        timeout: float = 300.0,
        job_id: Optional[str] = None,
        **kwargs: Any
    ) -> asyncio.Task:
        """
        Schedules an async background task with retry policies and timeout.
        """
        jid = job_id or str(uuid.uuid4())
        job_name = getattr(coro_fn, "__name__", str(coro_fn))
        first_attempt = datetime.now(timezone.utc)

        async def _execution_runner():
            attempt = 0
            self._jobs_processed += 1
            last_error: Optional[Exception] = None
            last_tb: str = ""

            while attempt <= max_retries:
                attempt += 1
                try:
                    logger.info(f"[JobQueue] Executing {job_name} (job_id={jid}, attempt={attempt}/{max_retries + 1})")
                    # Enforce per-job timeout
                    await asyncio.wait_for(coro_fn(*args, **kwargs), timeout=timeout)
                    self._jobs_succeeded += 1
                    logger.info(f"[JobQueue] Task succeeded: {job_name} (job_id={jid})")
                    return
                except Exception as e:
                    last_error = e
                    last_tb = traceback.format_exc()
                    if attempt <= max_retries:
                        self._jobs_retried += 1
                        delay = (initial_delay * (backoff_factor ** (attempt - 1))) + random.uniform(0.1, 0.5)
                        logger.warning(
                            f"[JobQueue] Task {job_name} (job_id={jid}) failed attempt {attempt}: {e}. "
                            f"Retrying in {delay:.2f}s..."
                        )
                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            f"[JobQueue] Task {job_name} (job_id={jid}) exhausted all {max_retries} retries! "
                            f"Moving to Dead-Letter Queue (DLQ). Error: {e}",
                            exc_info=e
                        )

            # Move to Dead-Letter Queue after all retries are exhausted
            self._jobs_failed += 1
            dl_job = DeadLetterJob(
                job_id=jid,
                job_name=job_name,
                error=str(last_error) if last_error else "Unknown error",
                traceback=last_tb,
                attempts=attempt,
                first_attempt_at=first_attempt,
                failed_at=datetime.now(timezone.utc),
                metadata={"args_count": len(args), "kwargs_keys": list(kwargs.keys())}
            )
            async with self._lock:
                if len(self._dlq) >= self.max_dlq_size:
                    self._dlq.pop(0)  # Evict oldest entry
                self._dlq.append(dl_job)

        task = asyncio.create_task(_execution_runner())
        return task

    async def get_dlq(self) -> List[Dict[str, Any]]:
        """Return snapshot of all jobs currently in Dead-Letter Queue."""
        async with self._lock:
            return [
                {
                    "job_id": j.job_id,
                    "job_name": j.job_name,
                    "error": j.error,
                    "traceback": j.traceback,
                    "attempts": j.attempts,
                    "first_attempt_at": j.first_attempt_at.isoformat(),
                    "failed_at": j.failed_at.isoformat(),
                    "metadata": j.metadata
                }
                for j in self._dlq
            ]

    async def clear_dlq(self) -> None:
        """Clear all entries from Dead-Letter Queue."""
        async with self._lock:
            self._dlq.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Return operational throughput metrics."""
        return {
            "jobs_processed": self._jobs_processed,
            "jobs_succeeded": self._jobs_succeeded,
            "jobs_failed": self._jobs_failed,
            "jobs_retried": self._jobs_retried,
            "dlq_depth": len(self._dlq)
        }


# Singleton job queue instance
job_queue = ResilientJobQueue()
BackgroundJobQueue = ResilientJobQueue  # Backward compatibility alias
