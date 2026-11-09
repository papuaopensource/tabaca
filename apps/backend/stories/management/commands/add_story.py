from django.core.management.base import BaseCommand, CommandError

from stories.services import PickError, add_pick


class Command(BaseCommand):
    help = "Add a hand-picked article by URL (title, summary and thumbnail come from the page)"

    def add_arguments(self, parser):
        parser.add_argument("url")
        parser.add_argument("--title", default="", help="Override the page's title")
        parser.add_argument("--snippet", default="", help="Override the page's summary")
        parser.add_argument("--image", default="", help="Override the thumbnail URL (https)")
        parser.add_argument(
            "--paper",
            action="store_true",
            help="A paper, report or book (no thumbnail needed)",
        )
        parser.add_argument("--venue", default="", help="Journal or publisher name")

    def handle(self, *args, **options):
        try:
            story, created = add_pick(
                options["url"],
                title=options["title"],
                snippet=options["snippet"],
                image_url=options["image"],
                kind="paper" if options["paper"] else "",
                venue=options["venue"],
            )
        except PickError as exc:
            raise CommandError(str(exc)) from exc
        status = "Ditambahkan" if created else "Sudah ada"
        self.stdout.write(self.style.SUCCESS(f"{status}: {story.title} ({story.url})"))
