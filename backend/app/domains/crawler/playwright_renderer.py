"""
playwright_renderer.py — Tier 2 JavaScript-Rendered Page Extractor
===================================================================
Uses Playwright headless Chromium to render JavaScript-heavy pages
that return insufficient content via plain HTTP.

When to use:
  - Tier 1 (httpx + BeautifulSoup) returns fewer than MIN_MEANINGFUL_WORDS.
  - Site is a known SPA framework (React, Vue, Angular) that requires JS.

What it does:
  - Launches a reusable Playwright Chromium browser (singleton per process).
  - Opens a new isolated context + page for each render.
  - Blocks images, fonts, media, and analytics requests (reduce bandwidth).
  - Waits for "domcontentloaded" then waits for network to be idle.
  - Extracts the final rendered HTML content.
  - Closes the page/context immediately to free resources.

Thread safety:
  - Browser is managed as an async singleton; concurrent renders each
    get their own BrowserContext.

Usage:
    renderer = await PlaywrightRenderer.get_instance()
    html = await renderer.render("https://example.com/spa-page")
"""
import asyncio
from typing import Optional

from backend.app.core.logging import logger

try:
    from playwright.async_api import (
        Browser,
        BrowserContext,
        Page,
        Playwright,
        async_playwright,
    )
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

RENDER_TIMEOUT_MS = 30_000         # 30 seconds max per page
NETWORK_IDLE_TIMEOUT_MS = 10_000   # wait up to 10s for network idle after load
MAX_CONTENT_BYTES = 10 * 1024 * 1024

# Resource types to block (reduces traffic and speeds up rendering)
BLOCKED_RESOURCE_TYPES = {"image", "media", "font", "stylesheet", "websocket"}

# Navigation wait strategy
WAIT_UNTIL = "domcontentloaded"


# Concurrency Semaphore to prevent memory exhaustion under high load
_RENDER_SEMAPHORE = asyncio.Semaphore(3)


class PlaywrightRenderer:
    """
    Async singleton wrapper around Playwright Chromium.

    Each call to `render()` gets an isolated BrowserContext so that
    cookies and storage from one site never leak to another.
    """

    _instance: Optional["PlaywrightRenderer"] = None
    _lock = asyncio.Lock()

    def __init__(self) -> None:
        self._playwright: Optional["Playwright"] = None
        self._browser: Optional["Browser"] = None

    # ------------------------------------------------------------------
    # Singleton lifecycle
    # ------------------------------------------------------------------

    @classmethod
    async def get_instance(cls) -> Optional["PlaywrightRenderer"]:
        """Returns the shared PlaywrightRenderer, starting it if needed.
        Returns None if Playwright is not installed."""
        if not PLAYWRIGHT_AVAILABLE:
            return None

        async with cls._lock:
            if cls._instance is None or not cls._instance._is_alive():
                inst = cls()
                await inst._start()
                cls._instance = inst
        return cls._instance

    @classmethod
    async def shutdown(cls) -> None:
        """Gracefully close the browser and Playwright session."""
        async with cls._lock:
            if cls._instance:
                await cls._instance._stop()
                cls._instance = None

    async def _start(self) -> None:
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-default-apps",
                "--mute-audio",
            ],
        )
        logger.info("Playwright Chromium browser started.")

    async def _stop(self) -> None:
        try:
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()
        except Exception as exc:
            logger.warning(f"Playwright shutdown error: {exc}")
        finally:
            self._browser = None
            self._playwright = None

    def _is_alive(self) -> bool:
        return (
            self._browser is not None
            and self._playwright is not None
            and self._browser.is_connected()
        )

    # ------------------------------------------------------------------
    # Rendering
    # ------------------------------------------------------------------

    async def render(self, url: str) -> Optional[str]:
        """
        Render `url` in a headless Chromium browser and return the full HTML.
        Bounded by _RENDER_SEMAPHORE to prevent memory exhaustion under concurrent loads.
        Returns None on any failure (timeout, crash, navigation error).
        """
        if not self._is_alive():
            logger.warning("Playwright browser is not alive — skipping Tier 2 render.")
            return None

        async with _RENDER_SEMAPHORE:
            context: Optional["BrowserContext"] = None
            page: Optional["Page"] = None
            try:
                context = await self._browser.new_context(
                    user_agent="RagCrawlerBot/1.0 (compatible; Chromium/playwright)",
                    ignore_https_errors=True,
                    java_script_enabled=True,
                )

                page = await context.new_page()

                # Block unnecessary resource types
                async def _block(route):
                    if route.request.resource_type in BLOCKED_RESOURCE_TYPES:
                        await route.abort()
                    else:
                        await route.continue_()

                await page.route("**/*", _block)

                # Navigate
                response = await page.goto(
                    url,
                    timeout=RENDER_TIMEOUT_MS,
                    wait_until=WAIT_UNTIL,
                )

                if response and response.status >= 400:
                    logger.debug(f"Playwright: HTTP {response.status} for {url}")
                    return None

                # Wait for network to settle (best-effort; ignore timeout)
                try:
                    await page.wait_for_load_state("networkidle", timeout=NETWORK_IDLE_TIMEOUT_MS)
                except Exception:
                    pass  # networkidle timeout is acceptable

                html = await page.content()

                if len(html.encode("utf-8", errors="replace")) > MAX_CONTENT_BYTES:
                    html = html[:MAX_CONTENT_BYTES]

                logger.debug(f"Playwright: rendered {url} ({len(html)} chars)")
                return html

            except Exception as exc:
                logger.warning(f"Playwright render failed for {url}: {type(exc).__name__}: {exc}")
                return None

            finally:
                try:
                    if page:
                        await page.close()
                    if context:
                        await context.close()
                except Exception:
                    pass
