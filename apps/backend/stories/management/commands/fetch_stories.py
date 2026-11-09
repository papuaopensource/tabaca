from django.core.management.base import BaseCommand

from curation.filter import Curator
from stories.models import Source
from stories.services import fetch_source, recheck_stories


class Command(BaseCommand):
    help = "Fetch stories from all active sources, keeping only safe stories about Papua"

    def add_arguments(self, parser):
        parser.add_argument("--source", type=str, help="Fetch only this source ID")

    def handle(self, *args, **options):
        # Manual sources (hand-picked articles) have no feed to fetch.
        sources = Source.objects.filter(is_active=True).exclude(feed_url="")
        if options.get("source"):
            sources = sources.filter(id=options["source"])

        if not sources.exists():
            self.stdout.write(self.style.WARNING("No active sources found."))
            return

        curator = Curator.from_db()
        for source in sources:
            self.stdout.write(f"Fetching {source.name}...")
            result = fetch_source(source, curator)
            if result.error:
                self.stdout.write(self.style.ERROR(f"  ✗ {source.name}: {result.error}"))
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ {source.name}: {result.story_count} lolos filter, "
                        f"{result.new_count} baru, {result.rejected_count} ditolak"
                    )
                )

        recheck = recheck_stories(curator)
        if recheck.deactivated:
            self.stdout.write(f"Pemeriksaan ulang: {recheck.deactivated} cerita dinonaktifkan")
