from .base import BaseAdapter, hash_url, html_to_text, truncate, parse_date


class BBCAdapter(BaseAdapter):
    source_id = "bbc"
    name = "BBC News"
    homepage = "https://www.bbc.com/news/world/asia"
    feed_url = "https://feeds.bbci.co.uk/news/world/asia/rss.xml"

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
