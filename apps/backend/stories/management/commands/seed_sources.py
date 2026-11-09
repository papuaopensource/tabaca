from django.core.management.base import BaseCommand
from stories.models import Source

SOURCES = [
    {
        "id": "bbc",
        "name": "BBC News",
        "homepage": "https://www.bbc.com/news/world/asia",
        "feed_url": "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
    },
    {
        "id": "theconversation",
        "name": "The Conversation",
        "homepage": "https://theconversation.com/asia-pacific",
        "feed_url": "https://theconversation.com/asia-pacific/articles.atom",
    },
    {
        "id": "jubi",
        "name": "Jubi",
        "homepage": "https://jubi.id",
        "feed_url": "https://jubi.id/feed/",
    },
    {
        "id": "antara-papua",
        "name": "Antara Papua",
        "homepage": "https://www.antaranews.com/tag/papua",
        "feed_url": "https://www.antaranews.com/rss/terkini.xml",
    },
]


class Command(BaseCommand):
    help = "Seed initial news sources into the database"

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for data in SOURCES:
            _, is_new = Source.objects.update_or_create(
                id=data["id"],
                defaults={k: v for k, v in data.items() if k != "id"},
            )
            if is_new:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created} new, {updated} updated sources.")
        )
