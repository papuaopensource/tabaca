"""Generic feed fetching. Any feed configured on a `Source` works without custom code.

Supported: RSS and Atom, the WordPress REST API (`/wp-json/wp/v2/posts?...`), useful when a
WordPress site's RSS can't be narrowed to a topic (e.g. its feeds all redirect to FeedBurner),
and the OpenAlex works API (`https://api.openalex.org/works?...`) for scholarly papers.
"""

import hashlib
import json
import re
import ssl
import time
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit, urlunsplit

import feedparser
from bs4 import BeautifulSoup
from django.utils import timezone

from .safety import is_tracking_pixel

USER_AGENT = "Tabaca/0.1 (+https://github.com/papuaopensource/tabaca)"
EXTRA_INTERMEDIATES = Path(__file__).parent / "certs" / "extra-intermediates.pem"
TIMEOUT_SECONDS = 20
MAX_FEED_BYTES = 10 * 1024 * 1024
# Long enough for the summary dialog in the extension (RSS excerpts are usually ~55 words).
SNIPPET_LENGTH = 500
IMAGE_PATH = re.compile(r"\.(jpe?g|png|webp|gif|avif)$", re.IGNORECASE)


class FeedError(Exception):
    pass


def build_ssl_context() -> ssl.SSLContext:
    """System trust store plus known public intermediates that some sites forget to send."""
    context = ssl.create_default_context()
    context.load_verify_locations(cafile=EXTRA_INTERMEDIATES)
    return context


_SSL_CONTEXT = build_ssl_context()


def hash_url(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def html_to_text(html: str) -> str:
    if not html:
        return ""
    text = BeautifulSoup(html, "lxml").get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()


# Boilerplate that feeds (mostly WordPress) append to excerpts.
_EXCERPT_MARKER = re.compile(r"\s*\[(?:…|\.\.\.)\]\s*$")
_FEED_FOOTERS = [
    re.compile(r"\s*The post .{1,300}? appeared first on .{1,200}?\.?\s*$", re.DOTALL),
    re.compile(r"\s*(?:Continue reading|Read more|Baca selengkapnya)[^.]{0,80}$", re.IGNORECASE),
]


def clean_summary(text: str) -> str:
    for footer in _FEED_FOOTERS:
        text = footer.sub("", text)
    if _EXCERPT_MARKER.search(text):
        text = _EXCERPT_MARKER.sub("", text).rstrip(" .,;:") + "…"
    return text.strip()


def truncate(text: str, length: int = SNIPPET_LENGTH) -> str:
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "…"


def url_words(url: str) -> str:
    """Turns a URL path like ``/2026/11/slot-gacor-hari-ini`` into searchable words."""
    path = unquote(urlsplit(url).path)
    return re.sub(r"[-_/.+]+", " ", path).strip()


def fetch_entries(feed_url: str) -> list:
    request = urllib.request.Request(
        feed_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": (
                "application/rss+xml, application/atom+xml, application/json, "
                "application/xml;q=0.9, */*;q=0.5"
            ),
        },
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS, context=_SSL_CONTEXT) as response:
        content_type = response.headers.get_content_type()
        data = response.read(MAX_FEED_BYTES + 1)
    if len(data) > MAX_FEED_BYTES:
        raise FeedError("Feed terlalu besar")

    if content_type == "application/json":
        try:
            payload = json.loads(data)
        except ValueError as exc:
            raise FeedError(f"JSON tidak valid: {exc}") from exc
        if isinstance(payload, dict) and "results" in payload and "meta" in payload:
            return openalex_entries(payload)
        return wordpress_entries(payload)

    feed = feedparser.parse(data)
    if feed.bozo and not feed.entries:
        raise FeedError(f"Feed tidak valid: {feed.get('bozo_exception')}")
    return feed.entries


def wordpress_entries(posts) -> list[dict]:
    """Maps WordPress REST API posts to the same shape as feedparser entries."""
    if not isinstance(posts, list):
        raise FeedError("Respons JSON bukan daftar post WordPress")

    entries = []
    for post in posts:
        if not isinstance(post, dict):
            continue
        embedded = post.get("_embedded") or {}
        media = (embedded.get("wp:featuredmedia") or [{}])[0] or {}
        author = (embedded.get("author") or [{}])[0] or {}
        try:
            published = time.strptime((post.get("date_gmt") or "")[:19], "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            published = None
        image = media.get("source_url") if isinstance(media, dict) else None
        entries.append(
            {
                "link": post.get("link") or "",
                "title": (post.get("title") or {}).get("rendered", ""),
                "summary": (post.get("excerpt") or {}).get("rendered", ""),
                "published_parsed": published,
                "author": author.get("name", "") if isinstance(author, dict) else "",
                "media_content": [{"url": image, "medium": "image"}] if image else [],
            }
        )
    return entries


def _abstract(inverted_index) -> str:
    """OpenAlex stores abstracts as {word: [positions]}; rebuild the text."""
    if not isinstance(inverted_index, dict):
        return ""
    words = {}
    for word, positions in inverted_index.items():
        for position in positions or []:
            if isinstance(position, int):
                words[position] = word
    return " ".join(words[i] for i in sorted(words))


def format_authors(names: list[str]) -> str:
    names = [n for n in names if n]
    if len(names) > 3:
        return f"{', '.join(names[:3])} et al."
    return ", ".join(names)


def clean_venue(name: str) -> str:
    """Short, readable journal/publisher names from OpenAlex.

    "Advances in x/Advances in X" -> "Advances in X"; "Zenodo (CERN …)" -> "Zenodo".
    """
    parts = [part.strip() for part in name.split("/")]
    if len(parts) == 2 and parts[0].lower() == parts[1].lower():
        name = parts[1]
    return re.sub(r"\s*\([^()]*\)$", "", name.strip())


def openalex_entries(payload: dict) -> list[dict]:
    """Maps OpenAlex works to feed-like entries. Papers link to their DOI."""
    entries = []
    for work in payload.get("results") or []:
        if not isinstance(work, dict) or not work.get("doi"):
            continue
        try:
            published = time.strptime(work.get("publication_date") or "", "%Y-%m-%d")
        except ValueError:
            published = None
        source = ((work.get("primary_location") or {}).get("source")) or {}
        authors = [
            ((a.get("author") or {}).get("display_name") or "")
            for a in work.get("authorships") or []
            if isinstance(a, dict)
        ]
        entries.append(
            {
                "link": work["doi"],
                "title": work.get("title") or "",
                "summary": _abstract(work.get("abstract_inverted_index")),
                "published_parsed": published,
                "author": format_authors(authors),
                "kind": "paper",
                "venue": clean_venue(source.get("display_name") or ""),
            }
        )
    return entries


def _parse_date(entry) -> datetime:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        return datetime(*parsed[:6], tzinfo=UTC)
    return timezone.now()


def _author(entry) -> str:
    author = entry.get("author") or entry.get("author_detail", {}).get("name", "")
    return html_to_text(author)[:200]


def _image(entry) -> str:
    for media in entry.get("media_content", []) or []:
        url = media.get("url", "")
        if url and (
            media.get("medium") == "image" or re.search(r"\.(jpe?g|png|webp|avif)", url, re.I)
        ):
            return url
    for thumb in entry.get("media_thumbnail", []) or []:
        if thumb.get("url"):
            return thumb["url"]
    for enclosure in entry.get("enclosures", []) or []:
        if "image" in enclosure.get("type", "") and enclosure.get("href"):
            return enclosure["href"]
    # WordPress feeds usually only embed images in the HTML body (content:encoded). Body HTML can
    # contain anything (tracking pixels, avatars, expiring WhatsApp links), so only real image
    # files count.
    html_parts = [entry.get("summary", "") or ""]
    html_parts += [c.get("value", "") for c in entry.get("content", []) or []]
    for part in html_parts:
        if "<img" not in part:
            continue
        for img in BeautifulSoup(part, "lxml").find_all("img"):
            url = (img.get("src") or "").strip()
            tiny = img.get("width") in ("0", "1") or img.get("height") in ("0", "1")
            if (
                not url.startswith("https://")
                or tiny
                or "gravatar.com" in url
                or is_tracking_pixel(url)
                or not IMAGE_PATH.search(urlsplit(url).path)
            ):
                continue
            return url
    return ""


TRACKING_PARAMS = ("utm_", "fbclid", "gclid", "mc_cid", "mc_eid")


def strip_tracking(url: str) -> str:
    """Drops tracking query params (utm_*, fbclid, …) so links are clean and stable."""
    parts = urlsplit(url)
    if not parts.query:
        return url
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if not key.lower().startswith(TRACKING_PARAMS)
    ]
    return urlunsplit(parts._replace(query=urlencode(query)))


def normalize_entry(entry) -> dict:
    link = strip_tracking((entry.get("link") or "").strip())
    if not link:
        raise FeedError("Entri tanpa tautan")
    return {
        "id": hash_url(link),
        "title": html_to_text(entry.get("title", ""))[:500],
        "url": link,
        "author": _author(entry),
        "published_at": _parse_date(entry),
        "snippet": truncate(clean_summary(html_to_text(entry.get("summary", "")))),
        "image_url": _image(entry),
        "kind": entry.get("kind") or "article",
        "venue": html_to_text(entry.get("venue") or "")[:200],
    }
