"""Link and image checks applied to every feed entry before it is stored."""

from urllib.parse import urlsplit


def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower().rstrip(".")
    return domain.removeprefix("www.")


def host_is_allowed(host: str, allowed_domains: list[str]) -> bool:
    host = normalize_domain(host)
    return any(host == d or host.endswith(f".{d}") for d in allowed_domains)


def is_safe_link(url: str, allowed_domains: list[str]) -> bool:
    """A story link must be plain http(s) and point at the source's own domain(s).

    This stops hijacked or spammy feeds from sending readers to unrelated sites.
    """
    try:
        parts = urlsplit(url)
    except ValueError:
        return False
    if parts.scheme not in ("http", "https") or not parts.hostname:
        return False
    if parts.username or parts.password:
        return False
    return host_is_allowed(parts.hostname, allowed_domains)


# Hosts and paths of view counters / tracking pixels that feeds embed as <img>.
_TRACKER_HOST_PREFIXES = ("counter.", "pixel.", "stats.", "analytics.", "tracking.", "beacon.")
_TRACKER_HOSTS = {"feeds.feedburner.com", "pixel.wp.com", "stats.wp.com"}
_TRACKER_PATH_PARTS = ("/count.gif", "/pixel", "/beacon", "/1x1", "/track")


def is_tracking_pixel(url: str) -> bool:
    parts = urlsplit(url)
    host = (parts.hostname or "").lower()
    path = parts.path.lower()
    return (
        host in _TRACKER_HOSTS
        or host.startswith(_TRACKER_HOST_PREFIXES)
        or any(part in path for part in _TRACKER_PATH_PARTS)
    )


def safe_image_url(url: str) -> str:
    """Only real https images are kept (the extension page is a secure context, and loading a
    feed's tracking pixel would count views for the publisher)."""
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    if parts.scheme != "https" or not parts.hostname or parts.username or parts.password:
        return ""
    if is_tracking_pixel(url):
        return ""
    return url
