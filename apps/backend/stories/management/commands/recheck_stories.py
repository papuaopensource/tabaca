from django.core.management.base import BaseCommand

from stories.services import recheck_stories


class Command(BaseCommand):
    help = "Re-apply the blocklist, link and thumbnail rules to stored stories (runs after fetch)"

    def handle(self, *args, **options):
        result = recheck_stories()
        self.stdout.write(self.style.SUCCESS(f"{result.deactivated} cerita dinonaktifkan."))
