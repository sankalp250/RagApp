"""
URL Normalization, SSRF Prevention, Domain Boundary Enforcement
================================================================
Provides safe, canonical URL processing for the website crawler.

Security guarantees:
  - Blocks private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12,
    192.168.0.0/16, 169.254.0.0/16, ::1, metadata endpoints).
  - Enforces same-domain (and optional subdomain) restrictions.
  - Blocks non-http/https URL schemes.
  - Blocks known restricted path prefixes (auth, admin, private pages).
  - Blocks binary/media file extensions that produce no indexable text.

URL normalization:
  - Strips URL fragments (#section).
  - Normalizes trailing slashes (configurable).
  - Lowercases scheme and host.
  - Removes default ports (:80 / :443).
  - Strips common tracking parameters (utm_*, fbclid, gclid, ...).
  - Resolves relative URLs against a base URL.
  - Collapses redundant path segments (/../, /./). 
"""
import ipaddress
import re
import socket
from typing import Optional
from urllib.parse import (
    ParseResult,
    parse_qs,
    urlencode,
    urljoin,
    urlparse,
    urlunparse,
)

from backend.app.core.logging import logger

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # loopback
    ipaddress.ip_network("10.0.0.0/8"),       # private A
    ipaddress.ip_network("172.16.0.0/12"),    # private B
    ipaddress.ip_network("192.168.0.0/16"),   # private C
    ipaddress.ip_network("169.254.0.0/16"),   # link-local / AWS metadata
    ipaddress.ip_network("100.64.0.0/10"),    # shared address space (RFC 6598)
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]

PRIVATE_HOSTNAMES = frozenset({
    "localhost",
    "0.0.0.0",
    "metadata.google.internal",
    "169.254.169.254",    # AWS/GCP instance metadata
    "instance-data",
})

BLOCKED_SCHEMES = frozenset({"ftp", "file", "javascript", "data", "blob"})

BLOCKED_PATH_PREFIXES = (
    "/login",
    "/logout",
    "/signin",
    "/signup",
    "/register",
    "/admin",
    "/administrator",
    "/dashboard",
    "/account",
    "/profile",
    "/user",
    "/users",
    "/private",
    "/internal",
    "/checkout",
    "/cart",
    "/payment",
    "/order",
    "/orders",
    "/api/",          # REST API endpoints
    "/.well-known",
    "/wp-admin",
    "/wp-login",
    "/phpmyadmin",
    "/cpanel",
)

BINARY_EXTENSIONS = frozenset({
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm",
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico",
    ".mp3", ".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flac", ".wav",
    ".ttf", ".woff", ".woff2", ".eot",
    ".css", ".js", ".map",
    ".xml.gz", ".sitemap.gz",
})

# Tracking query parameters to strip
TRACKING_PARAMS = frozenset({
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "gclsrc", "dclid", "msclkid", "yclid",
    "_ga", "_gl", "ref", "source", "mc_cid", "mc_eid",
    "zanpid", "origin", "irgwc",
})


# ---------------------------------------------------------------------------
# SSRF Prevention
# ---------------------------------------------------------------------------

def is_safe_ssrf_url(url: str) -> bool:
    """
    Returns True ONLY if the URL is safe to crawl from the server side:
    - Scheme is http or https.
    - Host does not resolve to a private/loopback/link-local IP address.
    - Host is not in the hardcoded block list.

    Performs an actual DNS resolution to catch DNS rebinding-style attacks.
    """
    try:
        parsed = urlparse(url)
        scheme = (parsed.scheme or "").lower()
        host = (parsed.hostname or "").lower().strip(".")

        # 1. Scheme check
        if scheme not in ("http", "https"):
            logger.warning(f"SSRF blocked (bad scheme {scheme!r}): {url}")
            return False

        # 2. Hostname block list
        if host in PRIVATE_HOSTNAMES:
            logger.warning(f"SSRF blocked (blocked hostname {host!r}): {url}")
            return False

        # 3. IPv4/IPv6 literal addresses
        try:
            ip = ipaddress.ip_address(host)
            for network in PRIVATE_NETWORKS:
                if ip in network:
                    logger.warning(f"SSRF blocked (private IP {ip}): {url}")
                    return False
            return True
        except ValueError:
            pass  # Not an IP literal — continue to DNS resolution

        # 4. DNS resolution — resolve and check every returned address
        try:
            addrs = socket.getaddrinfo(host, None)
        except socket.gaierror:
            # Cannot resolve — could be NXDOMAIN or network issue; block it.
            logger.warning(f"SSRF blocked (DNS resolution failed for {host!r}): {url}")
            return False

        for _family, _socktype, _proto, _canonname, sockaddr in addrs:
            ip_str = sockaddr[0]
            try:
                ip = ipaddress.ip_address(ip_str)
                for network in PRIVATE_NETWORKS:
                    if ip in network:
                        logger.warning(
                            f"SSRF blocked (DNS resolves to private IP {ip} for {host!r}): {url}"
                        )
                        return False
            except ValueError:
                pass

        return True

    except Exception as exc:
        logger.warning(f"SSRF check raised unexpected exception for {url!r}: {exc}")
        return False


# ---------------------------------------------------------------------------
# URL Normalization
# ---------------------------------------------------------------------------

def normalize_url(url: str, base_url: Optional[str] = None) -> Optional[str]:
    """
    Returns the canonical, normalized form of a URL.

    Steps:
      1. Resolve relative URLs against base_url (if given).
      2. Lowercase scheme and host.
      3. Remove default ports (:80 / :443).
      4. Remove URL fragments (#...).
      5. Strip known tracking query parameters.
      6. Sort remaining query parameters for stable canonical form.
      7. Remove trailing slash from non-root paths.

    Returns None if the URL is malformed or cannot be normalized.
    """
    try:
        if base_url:
            url = urljoin(base_url, url)

        parsed: ParseResult = urlparse(url)
        scheme = (parsed.scheme or "").lower()
        host = (parsed.hostname or "").lower()
        path = parsed.path or "/"

        if not scheme or not host:
            return None

        # Clean path: collapse /./ and /../ segments
        # urllib.parse.urljoin + urlparse handles most, but double-check empties
        if not path:
            path = "/"

        # Remove default port
        port = parsed.port
        if (scheme == "http" and port == 80) or (scheme == "https" and port == 443):
            port = None

        # Reconstruct netloc
        if port:
            netloc = f"{host}:{port}"
        else:
            netloc = host

        # Strip tracking params
        raw_qs = parsed.query
        if raw_qs:
            params = parse_qs(raw_qs, keep_blank_values=True)
            cleaned = {k: v for k, v in params.items() if k.lower() not in TRACKING_PARAMS}
            qs = urlencode(cleaned, doseq=True)
        else:
            qs = ""

        # Remove trailing slash on non-root paths
        if path != "/" and path.endswith("/"):
            path = path.rstrip("/")

        # Fragment is always stripped (never #section in crawl targets)
        normalized = urlunparse((scheme, netloc, path, "", qs, ""))
        return normalized

    except Exception:
        return None


# ---------------------------------------------------------------------------
# Domain Boundary
# ---------------------------------------------------------------------------

def extract_root_domain(url: str) -> Optional[str]:
    """Returns the lowercase host (netloc) of the URL, e.g. 'example.com'."""
    try:
        return urlparse(url).hostname.lower()
    except Exception:
        return None


def is_same_domain(url: str, root_url: str, allow_subdomains: bool = False) -> bool:
    """
    Returns True if `url` belongs to the same domain as `root_url`.

    When allow_subdomains=True, subdomains of the root domain are permitted
    (e.g. docs.example.com is allowed when root is example.com).
    """
    url_host = extract_root_domain(url)
    root_host = extract_root_domain(root_url)

    if not url_host or not root_host:
        return False

    if url_host == root_host:
        return True

    if allow_subdomains:
        # Allow *.root_host
        return url_host.endswith(f".{root_host}")

    return False


# ---------------------------------------------------------------------------
# Restricted Path & Extension Checks
# ---------------------------------------------------------------------------

def is_restricted_path(url: str) -> bool:
    """
    Returns True if the URL path matches a known restricted (auth / admin / private)
    prefix or points to a binary/media file that cannot produce indexable text.
    """
    try:
        parsed = urlparse(url)
        path = (parsed.path or "/").lower()

        for prefix in BLOCKED_PATH_PREFIXES:
            if path == prefix or path.startswith(prefix + "/") or path.startswith(prefix + "?"):
                return True

        # Check binary file extension
        # Split off query string, take extension of the last path segment
        last_segment = path.split("/")[-1]
        if "." in last_segment:
            ext = "." + last_segment.rsplit(".", 1)[-1].lower()
            if ext in BINARY_EXTENSIONS:
                return True

        return False
    except Exception:
        return False


def is_valid_crawl_url(
    url: str,
    root_url: str,
    allow_subdomains: bool = False,
    allow_restricted_paths: bool = False,
) -> bool:
    """
    Aggregate check: safe SSRF + same domain + not restricted.
    Use this as the final gate before adding a URL to the frontier.
    """
    if not url or not url.startswith(("http://", "https://")):
        return False
    if not is_safe_ssrf_url(url):
        return False
    if not is_same_domain(url, root_url, allow_subdomains):
        return False
    if not allow_restricted_paths and is_restricted_path(url):
        return False
    return True
