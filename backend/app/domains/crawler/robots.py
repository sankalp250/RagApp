"""
robots.py — Asynchronous robots.txt Parser
===========================================
Fetches and parses the robots.txt file for a target domain.

Compliance:
  - Respects User-agent: * and specific bot directives.
  - Extracts Crawl-delay (used to pace requests).
  - Extracts Sitemap declarations.
  - Gracefully degrades: if robots.txt is unavailable (timeout / 404),
    the crawler is permitted to proceed (fail-open, standard convention).

Usage:
    parser = await RobotsParser.fetch("https://example.com")
    parser.is_allowed("https://example.com/secret")   # False
    parser.is_allowed("https://example.com/about")    # True
    parser.crawl_delay                                 # float | None
    parser.sitemaps                                    # list[str]
"""
import asyncio
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx

from backend.app.core.logging import logger


class RobotsParser:
    """Parses robots.txt and answers is_allowed() queries for crawl targets."""

    USER_AGENT = "RagCrawlerBot/1.0"
    FETCH_TIMEOUT = 10.0

    def __init__(self) -> None:
        self._disallow: List[str] = []
        self._allow: List[str] = []
        self.crawl_delay: Optional[float] = None
        self.sitemaps: List[str] = []
        self._fetched = False

    # ------------------------------------------------------------------
    # Factory
    # ------------------------------------------------------------------

    @classmethod
    async def fetch(cls, root_url: str) -> "RobotsParser":
        """
        Asynchronously fetch and parse robots.txt for the given root URL.
        Returns a RobotsParser instance (even on failure — fail-open).
        """
        parser = cls()
        robots_url = urljoin(root_url, "/robots.txt")
        try:
            async with httpx.AsyncClient(
                timeout=cls.FETCH_TIMEOUT,
                follow_redirects=True,
                headers={"User-Agent": cls.USER_AGENT},
            ) as client:
                resp = await client.get(robots_url)
                if resp.status_code == 200:
                    parser._parse(resp.text, root_url)
                    parser._fetched = True
                    logger.info(
                        f"robots.txt fetched: {robots_url} "
                        f"(disallow={len(parser._disallow)}, "
                        f"sitemaps={len(parser.sitemaps)}, "
                        f"delay={parser.crawl_delay})"
                    )
                else:
                    logger.info(
                        f"robots.txt not found ({resp.status_code}) — crawl allowed: {root_url}"
                    )
        except Exception as exc:
            logger.warning(f"robots.txt fetch failed ({type(exc).__name__}) — defaulting open: {root_url}")

        return parser

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse(self, text: str, root_url: str) -> None:
        """Parse robots.txt text and populate allow/disallow/sitemap/delay."""
        # Track which group we're currently parsing
        # We look for:  "User-agent: *"  and  "User-agent: RagCrawlerBot"
        in_relevant_group = False
        relevant_user_agents = {"*", "ragcrawlerbot", self.USER_AGENT.lower().split("/")[0]}

        for raw_line in text.splitlines():
            line = raw_line.strip()

            # Strip comments
            if "#" in line:
                line = line[: line.index("#")].strip()

            if not line:
                continue

            key, _, value = line.partition(":")
            key = key.strip().lower()
            value = value.strip()

            if key == "user-agent":
                in_relevant_group = value.lower() in relevant_user_agents
            elif key == "disallow" and in_relevant_group and value:
                self._disallow.append(value)
            elif key == "allow" and in_relevant_group and value:
                self._allow.append(value)
            elif key == "crawl-delay" and in_relevant_group:
                try:
                    self.crawl_delay = float(value)
                except ValueError:
                    pass
            elif key == "sitemap" and value:
                # Sitemaps in robots.txt are absolute URLs
                self.sitemaps.append(value)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def is_allowed(self, url: str) -> bool:
        """
        Returns True if the URL is permitted by the parsed robots.txt rules.
        Follows the standard precedence: specific Allow rules override Disallow;
        longest matching prefix wins.
        """
        try:
            path = urlparse(url).path or "/"
        except Exception:
            return False

        # Find the longest matching rule among allows and disallows
        best_allow_len = -1
        best_disallow_len = -1

        for rule in self._allow:
            if path.startswith(rule):
                if len(rule) > best_allow_len:
                    best_allow_len = len(rule)

        for rule in self._disallow:
            if path.startswith(rule):
                if len(rule) > best_disallow_len:
                    best_disallow_len = len(rule)

        # If no rules matched at all → allowed
        if best_allow_len == -1 and best_disallow_len == -1:
            return True

        # Allow wins if it's at least as specific as Disallow
        if best_allow_len >= best_disallow_len:
            return True

        return False
