import asyncio
from typing import Callable, Any, Dict
from backend.app.core.logging import logger


class BackgroundJobQueue:
    """
    Asynchronous in-process job queue dispatcher.
    Allows non-blocking background job scheduling for document parsing, evaluation, and clustering.
    Can seamlessly connect to Celery / Redis Streams in production.
    """
    @staticmethod
    def enqueue(coro_fn: Callable[..., Any], *args: Any, **kwargs: Any) -> asyncio.Task:
        job_name = getattr(coro_fn, "__name__", str(coro_fn))
        logger.info(f"Enqueuing background task: {job_name}")

        async def _wrapper():
            try:
                await coro_fn(*args, **kwargs)
                logger.info(f"Background task completed successfully: {job_name}")
            except Exception as e:
                logger.error(f"Background task failed: {job_name} - {e}", exc_info=e)

        task = asyncio.create_task(_wrapper())
        return task


job_queue = BackgroundJobQueue()
