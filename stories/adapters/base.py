import hashlib
import re
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
from django.utils import timezone


def hash_url(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def html_to_text(html: str) -> str:
    return BeautifulSoup(html, "lxml").get_text(separator=" ").strip()


def truncate(text: str, length: int = 200) -> str:
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "…"


def parse_date(date_str: str):
    try:
        dt = dateparser.parse(date_str)
        if dt and dt.tzinfo is None:
            from django.utils import timezone as tz
            dt = tz.make_aware(dt)
        return dt
    except Exception:
        return timezone.now()


class BaseAdapter:
    source_id: str
    name: str
    homepage: str
    feed_url: str

    def fetch(self) -> list:
        feed = feedparser.parse(self.feed_url)
        return feed.entries

    def normalize(self, entry) -> dict:
        raise NotImplementedError

    def _get_image(self, entry) -> str:
        if hasattr(entry, "media_content") and entry.media_content:
            for media in entry.media_content:
                url = media.get("url", "")
                if url and (media.get("medium") == "image" or re.search(r"\.(jpg|jpeg|png|webp)", url, re.I)):
                    return url
        if hasattr(entry, "enclosures") and entry.enclosures:
            for enc in entry.enclosures:
                if "image" in enc.get("type", ""):
                    return enc.get("url", "")
        # Fallback: first <img> in summary
        summary = getattr(entry, "summary", "") or ""
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary)
        if match:
            return match.group(1)
        return ""
