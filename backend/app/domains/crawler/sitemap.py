"""
sitemap.py — XML Sitemap & Sitemap Index Discoverer
=====================================================
Recursively fetches and parses XML sitemaps (including sitemapindex files)
to extract a set of crawlable page URLs for the target domain.

Supports:
  - Standard sitemap.xml (<urlset> with <url><loc>)
  - Sitemap index files (<sitemapindex> with <sitemap><loc>)
  - Recursive child-sitemap fetching (depth-limited)
  - Per-URL lastmod, changefreq, priority (for future scheduling)
  - Gzip-compressed sitemaps (via httpx transparent decompression)
  - Domain boundary validation for each discovered URL

Usage:
    discoverer = SitemapDiscoverer(root_url="https://example.com", allow_subdomains=False)
    urls = await discoverer.discover(known_sitemap_urls=["https://example.com/sitemap.xml"])
    # urls -> set of normalized, same-domain URLs
"""
import asyncio
from typing import List, Optional, Set
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

import httpx

from backend.app.core.logging import logger
from backend.app.domains.crawler.url_tools import is_same_domain, normalize_url


# XML namespaces used in sitemaps
_NS = {
    "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "news": "http://www.google.com/schemas/sitemap-news/0.9",
    "image": "http://www.google.com/schemas/sitemap-image/1.1",
}

_COMMON_SITEMAP_PATHS = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/sitemaps/sitemap.xml",
    "/sitemap/sitemap.xml",
]

_MAX_SITEMAP_DEPTH = 3      # Maximum sitemap index recursion depth
_MAX_SITEMAP_SIZE = 50 * 1024 * 1024  # 50 MB raw bytes safety cap
_FETCH_TIMEOUT = 20.0


class SitemapDiscoverer:
    """Discovers all crawlable URLs for a domain via XML sitemaps."""

    USER_AGENT = "RagCrawlerBot/1.0 (+https://your-platform.com/bot)"

    def __init__(self, root_url: str, allow_subdomains: bool = False) -> None:
        self.root_url = root_url.rstrip("/")
        self.allow_subdomains = allow_subdomains
        self._visited_sitemaps: Set[str] = set()
        self._discovered_urls: Set[str] = set()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def discover(
        self,
        known_sitemap_urls: Optional[List[str]] = None,
    ) -> Set[str]:
        """
        Returns a set of normalized, same-domain page URLs discovered
        from all reachable sitemaps for the target domain.

        Args:
            known_sitemap_urls: Optional list of sitemap URLs already known
                                (e.g. from robots.txt Sitemap: directives).
        """
        seeds: List[str] = list(known_sitemap_urls or [])

        # Always probe common paths if nothing was explicitly provided
        if not seeds:
            seeds = [urljoin(self.root_url, p) for p in _COMMON_SITEMAP_PATHS]

        async with httpx.AsyncClient(
            timeout=_FETCH_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": self.USER_AGENT},
        ) as client:
            tasks = [self._process_sitemap(client, url, depth=0) for url in seeds]
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.info(
            f"Sitemap discovery complete: {len(self._discovered_urls)} URLs found "
            f"from {len(self._visited_sitemaps)} sitemaps for {self.root_url}"
        )
        return self._discovered_urls

    # ------------------------------------------------------------------
    # Internal fetching and parsing
    # ------------------------------------------------------------------

    async def _process_sitemap(
        self, client: httpx.AsyncClient, sitemap_url: str, depth: int
    ) -> None:
        """Fetch and parse a single sitemap or sitemap index."""
        if depth > _MAX_SITEMAP_DEPTH:
            logger.warning(f"Sitemap depth limit reached at: {sitemap_url}")
            return

        norm = normalize_url(sitemap_url)
        if not norm or norm in self._visited_sitemaps:
            return
        self._visited_sitemaps.add(norm)

        try:
            resp = await client.get(sitemap_url)
            if resp.status_code != 200:
                logger.debug(f"Sitemap returned {resp.status_code}: {sitemap_url}")
                return

            content = resp.content
            if len(content) > _MAX_SITEMAP_SIZE:
                logger.warning(f"Sitemap too large ({len(content)} bytes), skipping: {sitemap_url}")
                return

            await self._parse_xml(client, content, depth)

        except (httpx.TimeoutException, httpx.RequestError) as exc:
            logger.debug(f"Sitemap fetch failed ({type(exc).__name__}): {sitemap_url}")
        except Exception as exc:
            logger.warning(f"Sitemap parsing error for {sitemap_url}: {exc}")

    async def _parse_xml(
        self, client: httpx.AsyncClient, content: bytes, depth: int
    ) -> None:
        """Parse sitemap XML and enqueue child sitemaps or add page URLs."""
        try:
            # Strip leading whitespace/BOM that can break the XML parser
            content = content.lstrip(b"\xff\xfe\xef\xbb\xbf \t\r\n")
            root = ET.fromstring(content)

            # Normalize tag name (strip namespace)
            tag = root.tag
            if "}" in tag:
                tag = tag.split("}")[1]

            if tag == "sitemapindex":
                # Sitemap index: recurse into child sitemaps
                child_urls = []
                for sitemap_el in root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
                    child_url = (sitemap_el.text or "").strip()
                    if child_url:
                        child_urls.append(child_url)
                # Also try without namespace
                for sitemap_el in root.iter("loc"):
                    child_url = (sitemap_el.text or "").strip()
                    if child_url and child_url not in child_urls:
                        child_urls.append(child_url)

                tasks = [self._process_sitemap(client, u, depth + 1) for u in child_urls]
                await asyncio.gather(*tasks, return_exceptions=True)

            elif tag == "urlset":
                # Standard sitemap: collect <url><loc> entries
                locs = list(root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc"))
                if not locs:
                    locs = list(root.iter("loc"))

                for loc_el in locs:
                    url = (loc_el.text or "").strip()
                    if not url:
                        continue
                    norm = normalize_url(url)
                    if not norm:
                        continue
                    if not is_same_domain(norm, self.root_url, self.allow_subdomains):
                        continue
                    self._discovered_urls.add(norm)

            else:
                logger.debug(f"Unknown sitemap root element: {tag!r}")

        except ET.ParseError as exc:
            logger.debug(f"Sitemap XML parse error: {exc}")
        except Exception as exc:
            logger.warning(f"Unexpected sitemap parse error: {exc}")
