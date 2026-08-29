"""
html_cleaner.py — Tier 1 HTML Content Extractor & Markdown Converter
======================================================================
Extracts meaningful text content from raw HTML responses using
BeautifulSoup4 + lxml, producing clean, normalized Markdown for
knowledge document ingestion.

Key operations:
  1. Remove noise elements (scripts, styles, ads, navs, footers,
     cookie banners, hidden elements, tracking pixels).
  2. Extract canonical URL from <link rel="canonical">.
  3. Extract <title>, <meta name="description">, Open Graph metadata.
  4. Extract headings (h1–h6), paragraphs, lists, code blocks.
  5. Produce clean Markdown output.
  6. Compute SHA-256 content hash over the normalized text.
  7. Decide whether extracted content is "meaningful" enough to use
     directly or requires Playwright Tier 2 rendering.

Usage:
    result = HTMLCleaner.extract(html_bytes, url)
    result.title
    result.content_markdown
    result.content_hash
    result.canonical_url
    result.links            # list of absolute internal candidate links
    result.is_meaningful    # bool — True → use Tier 1, False → try Tier 2
"""
import hashlib
import re
from dataclasses import dataclass, field
from typing import List, Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

from backend.app.core.logging import logger

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

# Minimum number of words in the extracted text to be considered "meaningful".
# Pages with fewer words are likely SPA shells or login/redirect pages.
MIN_MEANINGFUL_WORDS = 40

# Maximum raw content bytes we'll process (10 MB); truncate larger payloads.
MAX_CONTENT_BYTES = 10 * 1024 * 1024

# ---------------------------------------------------------------------------
# Tags to outright remove (including all children)
# ---------------------------------------------------------------------------

NOISE_TAGS = {
    "script", "style", "link", "meta", "noscript",
    "iframe", "embed", "object", "video", "audio", "canvas",
    "svg", "math",
}

NOISE_ROLE_VALUES = {"banner", "navigation", "complementary", "contentinfo"}

NOISE_CLASS_PATTERNS = re.compile(
    r"(cookie|consent|gdpr|banner|popup|modal|overlay|ad[-_]|advert|"
    r"newsletter|subscription|sidebar|breadcrumb|pagination|social|share|"
    r"widget|promo|announcement|notification|sticky|fixed-top|fixed-bottom|"
    r"skip-link|skip-nav)",
    re.IGNORECASE,
)

NOISE_ID_PATTERNS = re.compile(
    r"(cookie|consent|gdpr|popup|modal|overlay|ad[-_]|newsletter|sidebar|"
    r"promo|notification|announcement)",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Data container
# ---------------------------------------------------------------------------

@dataclass
class ExtractionResult:
    url: str
    canonical_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    content_markdown: str = ""
    content_hash: str = ""
    links: List[str] = field(default_factory=list)
    is_meaningful: bool = False
    word_count: int = 0


# ---------------------------------------------------------------------------
# Main extractor
# ---------------------------------------------------------------------------

class HTMLCleaner:
    """Stateless HTML content extractor."""

    @staticmethod
    def extract(html: bytes | str, page_url: str) -> ExtractionResult:
        """
        Parse `html` and return a clean ExtractionResult for `page_url`.
        Thread-safe and stateless — creates a fresh BeautifulSoup each call.
        """
        result = ExtractionResult(url=page_url)

        if isinstance(html, bytes):
            if len(html) > MAX_CONTENT_BYTES:
                html = html[:MAX_CONTENT_BYTES]
            try:
                html = html.decode("utf-8", errors="replace")
            except Exception:
                html = html.decode("latin-1", errors="replace")

        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            try:
                soup = BeautifulSoup(html, "html.parser")
            except Exception as exc:
                logger.warning(f"HTML parse failed completely for {page_url}: {exc}")
                return result

        # ---- Canonical URL ------------------------------------------------
        canonical_tag = soup.find("link", rel=lambda r: r and "canonical" in r)
        if canonical_tag and canonical_tag.get("href"):
            raw = canonical_tag["href"].strip()
            result.canonical_url = urljoin(page_url, raw) if raw else None

        # ---- Title ----------------------------------------------------------
        title_tag = soup.find("title")
        if title_tag:
            result.title = title_tag.get_text(strip=True)

        # Open Graph title fallback
        if not result.title:
            og_title = soup.find("meta", property="og:title")
            if og_title:
                result.title = og_title.get("content", "").strip() or None

        # ---- Meta description -----------------------------------------------
        desc_tag = soup.find("meta", attrs={"name": "description"})
        if desc_tag:
            result.description = (desc_tag.get("content") or "").strip() or None
        if not result.description:
            og_desc = soup.find("meta", property="og:description")
            if og_desc:
                result.description = (og_desc.get("content") or "").strip() or None

        # ---- Extract all outgoing links (before cleaning) --------------------
        result.links = _extract_links(soup, page_url)

        # ---- Remove noise elements -----------------------------------------
        _strip_noise(soup)

        # ---- Build Markdown text -------------------------------------------
        body = soup.find("main") or soup.find("article") or soup.find("body") or soup
        result.content_markdown = _to_markdown(body, result.title, result.description)

        # ---- Content hash --------------------------------------------------
        normalized_text = re.sub(r"\s+", " ", result.content_markdown).strip()
        result.content_hash = hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()

        # ---- Meaningfulness -------------------------------------------------
        result.word_count = len(normalized_text.split())
        result.is_meaningful = result.word_count >= MIN_MEANINGFUL_WORDS

        return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _strip_noise(soup: BeautifulSoup) -> None:
    """Remove all noise elements from the soup in-place."""

    # 1. Core noise tags
    for tag in NOISE_TAGS:
        for el in soup.find_all(tag):
            el.decompose()

    # 2. Elements with ARIA landmark roles that are navigation/peripheral
    for el in soup.find_all(attrs={"role": True}):
        if el.get("role", "").lower() in NOISE_ROLE_VALUES:
            el.decompose()

    # 3. Elements hidden via style/aria
    for el in soup.find_all(attrs={"aria-hidden": "true"}):
        el.decompose()
    for el in soup.find_all(style=True):
        style = el.get("style", "").lower()
        if "display:none" in style.replace(" ", "") or "visibility:hidden" in style.replace(" ", ""):
            el.decompose()

    # 4. Noisy by class or id name patterns
    for el in soup.find_all(True):
        try:
            classes = " ".join(el.get("class", []))
            el_id = el.get("id", "")
            if NOISE_CLASS_PATTERNS.search(classes) or NOISE_ID_PATTERNS.search(el_id):
                el.decompose()
        except Exception:
            pass

    # 5. <nav>, <header>, <footer> semantic noise
    for tag in ("nav", "header", "footer", "aside"):
        for el in soup.find_all(tag):
            el.decompose()


def _extract_links(soup: BeautifulSoup, base_url: str) -> List[str]:
    """Return a list of absolute URLs from all <a href> elements."""
    links = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        try:
            absolute = urljoin(base_url, href)
            # Only http/https links
            if absolute.startswith(("http://", "https://")):
                links.append(absolute)
        except Exception:
            pass
    return links


def _to_markdown(container, title: Optional[str], description: Optional[str]) -> str:
    """Convert a BeautifulSoup element tree to clean Markdown text."""
    parts = []

    if title:
        parts.append(f"# {title}\n")

    if description:
        parts.append(f"_{description}_\n")

    def _process(el) -> None:
        if isinstance(el, str):
            text = el.strip()
            if text:
                parts.append(text + " ")
            return

        if not isinstance(el, Tag):
            return

        name = el.name or ""

        if name in ("h1", "h2", "h3", "h4", "h5", "h6"):
            level = int(name[1])
            heading_text = el.get_text(separator=" ", strip=True)
            if heading_text:
                parts.append(f"\n{'#' * level} {heading_text}\n")

        elif name == "p":
            text = el.get_text(separator=" ", strip=True)
            if text:
                parts.append(f"\n{text}\n")

        elif name in ("ul", "ol"):
            for i, li in enumerate(el.find_all("li", recursive=False), 1):
                li_text = li.get_text(separator=" ", strip=True)
                if li_text:
                    bullet = f"{i}." if name == "ol" else "-"
                    parts.append(f"\n{bullet} {li_text}")
            parts.append("\n")

        elif name in ("code", "pre"):
            code = el.get_text(strip=True)
            if code:
                parts.append(f"\n```\n{code}\n```\n")

        elif name == "blockquote":
            text = el.get_text(separator=" ", strip=True)
            if text:
                parts.append(f"\n> {text}\n")

        elif name == "br":
            parts.append("\n")

        elif name == "hr":
            parts.append("\n---\n")

        elif name == "table":
            # Simple table → plain text rows
            for row in el.find_all("tr"):
                cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
                if cells:
                    parts.append("| " + " | ".join(cells) + " |\n")
            parts.append("\n")

        else:
            for child in el.children:
                _process(child)

    _process(container)

    return "\n".join(parts).strip()
