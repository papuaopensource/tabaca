from .base import BaseAdapter, hash_url, html_to_text, truncate, parse_date


class AntaraPapuaAdapter(BaseAdapter):
    source_id = "antara-papua"
    name = "Antara Papua"
    homepage = "https://www.antaranews.com/tag/papua"
    feed_url = "https://www.antaranews.com/rss/terkini.xml"

    def normalize(self, entry) -> dict:
        return {
            "id": hash_url(entry.link),
            "title": html_to_text(entry.get("title", "")),
            "url": entry.link,
            "source_id": self.source_id,
            "author": entry.get("author", ""),
            "published_at": parse_date(entry.get("published", "")),
            "snippet": truncate(html_to_text(entry.get("summary", "")), 200),
            "image_url": self._get_image(entry),
        }
