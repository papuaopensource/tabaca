from .base import BaseAdapter, hash_url, html_to_text, truncate, parse_date


class JubiAdapter(BaseAdapter):
    source_id = "jubi"
    name = "Jubi"
    homepage = "https://jubi.id"
    feed_url = "https://jubi.id/feed/"

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
