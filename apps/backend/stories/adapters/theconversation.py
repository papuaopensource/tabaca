from .base import BaseAdapter, hash_url, html_to_text, truncate, parse_date


class TheConversationAdapter(BaseAdapter):
    source_id = "theconversation"
    name = "The Conversation"
    homepage = "https://theconversation.com/asia-pacific"
    feed_url = "https://theconversation.com/asia-pacific/articles.atom"

    def normalize(self, entry) -> dict:
        # Atom feeds use entry.author_detail or entry.author
        author = ""
        if hasattr(entry, "author_detail"):
            author = entry.author_detail.get("name", "")
        elif hasattr(entry, "author"):
            author = entry.author or ""

        return {
            "id": hash_url(entry.link),
            "title": html_to_text(entry.get("title", "")),
            "url": entry.link,
            "source_id": self.source_id,
            "author": author,
            "published_at": parse_date(entry.get("published", "") or entry.get("updated", "")),
            "snippet": truncate(html_to_text(entry.get("summary", "")), 200),
            "image_url": self._get_image(entry),
        }
