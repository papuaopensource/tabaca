"""Reads an article page's preview metadata (OpenGraph / meta tags), like link previews do.

Used for hand-picked articles and for feeds that don't include a thumbnail.
"""

import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .feeds import _SSL_CONTEXT, TIMEOUT_SECONDS, USER_AGENT, format_authors, html_to_text

MAX_PAGE_BYTES = 3 * 1024 * 1024


@dataclass
class PageMeta:
    title: str = ""
    description: str = ""
    image: str = ""
    author: str = ""
    published_at: datetime | None = None
    #: Set when the page is a scholarly article (Google Scholar `citation_*` tags).
    venue: str = ""
    is_paper: bool = False


def _meta(soup: BeautifulSoup, *names: str) -> str:
    for name in names:
        tag = soup.find("meta", attrs={"property": name}) or soup.find("meta", attrs={"name": name})
        if tag and tag.get("content", "").strip():
            return tag["content"].strip()
    return ""


def _parse_datetime(value: str) -> datetime | None:
    if not value:
        return None
    value = value.strip().replace("/", "-")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    # Scholarly dates are often just a day ("2024-05-01"); treat them as UTC.
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def parse_page_meta(html: str, base_url: str) -> PageMeta:
    soup = BeautifulSoup(html, "lxml")
    venue = _meta(soup, "citation_journal_title", "citation_conference_title")
    if venue:
        return _scholarly_meta(soup, venue, base_url)
    title = _meta(soup, "og:title", "twitter:title") or (
        soup.title.get_text(strip=True) if soup.title else ""
    )
    image = _meta(soup, "og:image:secure_url", "og:image", "twitter:image")
    published = _meta(soup, "article:published_time", "datePublished", "date")
    if not published and (time_tag := soup.find("time", attrs={"datetime": True})):
        published = time_tag["datetime"]
    return PageMeta(
        title=html_to_text(title),
        description=html_to_text(_meta(soup, "og:description", "description")),
        image=urljoin(base_url, image) if image else "",
        author=html_to_text(_meta(soup, "article:author", "author"))[:200],
        published_at=_parse_datetime(published),
    )


def _scholarly_meta(soup: BeautifulSoup, venue: str, base_url: str) -> PageMeta:
    authors = [
        tag.get("content", "").strip()
        for tag in soup.find_all("meta", attrs={"name": "citation_author"})
    ]
    image = _meta(soup, "og:image")
    return PageMeta(
        title=html_to_text(_meta(soup, "citation_title", "og:title")),
        description=html_to_text(
            _meta(soup, "citation_abstract", "DC.Description", "og:description", "description")
        ),
        image=urljoin(base_url, image) if image else "",
        author=format_authors(authors)[:200],
        published_at=_parse_datetime(
            _meta(soup, "citation_publication_date", "citation_date", "citation_online_date")
        ),
        venue=html_to_text(venue)[:200],
        is_paper=True,
    )


def fetch_page_meta(url: str) -> PageMeta:
    request = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS, context=_SSL_CONTEXT) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        html = resp.read(MAX_PAGE_BYTES).decode(charset, errors="replace")
    return parse_page_meta(html, url)
