from django.core.management.base import BaseCommand
from curation.models import Keyword

KEYWORDS = [
    # Wilayah utama
    ("Papua", "BOTH", 1),
    ("West Papua", "IDN", 2),
    ("Papua Barat", "IDN", 2),
    ("Papua Pegunungan", "IDN", 2),
    ("Papua Selatan", "IDN", 2),
    ("Papua Tengah", "IDN", 2),
    ("Papua New Guinea", "PNG", 1),
    ("PNG", "PNG", 1),
    # Kota & kabupaten
    ("Jayapura", "IDN", 2),
    ("Merauke", "IDN", 2),
    ("Sorong", "IDN", 2),
    ("Manokwari", "IDN", 2),
    ("Timika", "IDN", 2),
    ("Biak", "IDN", 2),
    ("Nabire", "IDN", 2),
    ("Wamena", "IDN", 2),
    ("Fakfak", "IDN", 2),
    ("Kaimana", "IDN", 2),
    ("Serui", "IDN", 2),
    ("Ransiki", "IDN", 2),
    ("Port Numbay", "IDN", 2),
    ("Port Moresby", "PNG", 2),
    ("Lae", "PNG", 1),
    # Suku & budaya
    ("Dani", "IDN", 1),
    ("Asmat", "IDN", 2),
    ("Mee", "IDN", 1),
    ("Biak Numfor", "IDN", 2),
    ("Korowai", "IDN", 2),
    ("Kamoro", "IDN", 2),
    ("Pegunungan Tengah", "IDN", 2),
    ("orang asli Papua", "IDN", 2),
    ("Melanesia", "BOTH", 1),
    # Isu & organisasi
    ("OPM", "IDN", 2),
    ("TPNPB", "IDN", 2),
    ("KKB", "IDN", 2),
    ("otsus Papua", "IDN", 2),
    ("otonomi khusus Papua", "IDN", 2),
    ("Freeport", "IDN", 1),
    ("Grasberg", "IDN", 2),
    ("Nemangkawi", "IDN", 2),
    ("Papua merdeka", "IDN", 2),
    ("self-determination Papua", "IDN", 2),
    ("Papuan independence", "IDN", 2),
    ("human rights Papua", "IDN", 2),
    ("hak asasi Papua", "IDN", 2),
    ("konflik Papua", "IDN", 2),
    ("Papua conflict", "IDN", 2),
    ("militer Papua", "IDN", 2),
    ("operasi militer Papua", "IDN", 2),
    ("deforestation Papua", "BOTH", 1),
    ("deforestasi Papua", "IDN", 2),
    ("hutan Papua", "IDN", 2),
    ("Papua forest", "BOTH", 1),
    # Geografis
    ("Cenderawasih", "IDN", 2),
    ("Teluk Cenderawasih", "IDN", 2),
    ("Bird of Paradise", "BOTH", 1),
    ("Cenderawasih Bay", "IDN", 2),
    ("Raja Ampat", "IDN", 2),
    ("Puncak Jaya", "IDN", 2),
    ("Lorentz", "IDN", 2),
]


class Command(BaseCommand):
    help = "Seed initial Papua keywords into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing keywords before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            count = Keyword.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f"Deleted {count} keywords."))

        created = 0
        updated = 0
        for term, region, weight in KEYWORDS:
            _, is_new = Keyword.objects.update_or_create(
                term=term,
                defaults={"region": region, "weight": weight, "is_active": True},
            )
            if is_new:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created} new, {updated} updated keywords.")
        )
