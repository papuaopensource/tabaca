import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from stories.models import Source, Story, FetchLog
from stories.adapters import get_adapter
from curation.filter import filter_by_papua_scope


class Command(BaseCommand):
    help = "Fetch stories from all active sources and filter by Papua scope"

    def add_arguments(self, parser):
        parser.add_argument("--source", type=str, help="Fetch only this source ID")

    def handle(self, *args, **options):
        sources = Source.objects.filter(is_active=True)
        if options.get("source"):
            sources = sources.filter(id=options["source"])

        if not sources.exists():
            self.stdout.write(self.style.WARNING("No active sources found."))
            return

        for source in sources:
            self._fetch_source(source)

    def _fetch_source(self, source: Source):
        self.stdout.write(f"Fetching {source.name}...")
        start = time.time()
        log = FetchLog(source=source)

        try:
            adapter = get_adapter(source.id)
            entries = adapter.fetch()

            story_count = 0
            new_count = 0

            for entry in entries:
                try:
                    raw = adapter.normalize(entry)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipping entry: {e}"))
                    continue

                text = f"{raw['title']} {raw['snippet']}"
                result = filter_by_papua_scope(text)

                if not result["passes"]:
                    continue

                story_count += 1
                _, created = Story.objects.get_or_create(
                    id=raw["id"],
                    defaults={
                        **raw,
                        "matched_keywords": result["matched_keywords"],
                        "region": result["region"] or "",
                        "fetched_at": timezone.now(),
                    },
                )
                if created:
                    new_count += 1

            log.story_count = story_count
            log.new_count = new_count
            log.duration_ms = int((time.time() - start) * 1000)
            log.save()

            source.last_fetch_at = timezone.now()
            source.last_error = ""
            source.save(update_fields=["last_fetch_at", "last_error"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"  ✓ {source.name}: {story_count} lolos filter, {new_count} baru"
                )
            )

        except Exception as e:
            log.error = str(e)
            log.duration_ms = int((time.time() - start) * 1000)
            log.save()

            source.last_error = str(e)
            source.save(update_fields=["last_error"])

            self.stdout.write(self.style.ERROR(f"  ✗ {source.name}: {e}"))
