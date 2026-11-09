from django.core.management.base import BaseCommand

from curation.models import BlockedKeyword, Keyword

# (term, region, weight). A story passes when the weights of matched terms add up to >= 1.
KEYWORDS = [
    # Wilayah utama
    ("Papua", "BOTH", 1),
    ("West Papua", "IDN", 2),
    ("Papua Barat", "IDN", 2),
    ("Papua Barat Daya", "IDN", 2),
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
    ("Mimika", "IDN", 2),
    ("Biak", "IDN", 2),
    ("Nabire", "IDN", 2),
    ("Wamena", "IDN", 2),
    ("Jayawijaya", "IDN", 2),
    ("Fakfak", "IDN", 2),
    ("Kaimana", "IDN", 2),
    ("Serui", "IDN", 2),
    ("Kepulauan Yapen", "IDN", 2),
    ("Ransiki", "IDN", 2),
    ("Port Numbay", "IDN", 2),
    ("Nduga", "IDN", 2),
    ("Intan Jaya", "IDN", 2),
    ("Yahukimo", "IDN", 2),
    ("Paniai", "IDN", 2),
    ("Dogiyai", "IDN", 2),
    ("Deiyai", "IDN", 2),
    ("Lanny Jaya", "IDN", 2),
    ("Tolikara", "IDN", 2),
    ("Yalimo", "IDN", 2),
    ("Pegunungan Bintang", "IDN", 2),
    ("Mamberamo", "IDN", 2),
    ("Keerom", "IDN", 2),
    ("Sarmi", "IDN", 2),
    ("Waropen", "IDN", 2),
    ("Supiori", "IDN", 2),
    ("Boven Digoel", "IDN", 2),
    ("Mappi", "IDN", 2),
    ("Teluk Bintuni", "IDN", 2),
    ("Teluk Wondama", "IDN", 2),
    ("Tambrauw", "IDN", 2),
    ("Maybrat", "IDN", 2),
    ("Pegunungan Arfak", "IDN", 2),
    ("Kabupaten Puncak", "IDN", 2),
    ("Port Moresby", "PNG", 2),
    ("Lae", "PNG", 1),
    # Suku & budaya
    ("suku Dani", "IDN", 2),
    ("Dani tribe", "IDN", 2),
    ("Asmat", "IDN", 2),
    ("suku Mee", "IDN", 2),
    ("Biak Numfor", "IDN", 2),
    ("Korowai", "IDN", 2),
    ("Kamoro", "IDN", 2),
    ("Pegunungan Tengah", "IDN", 2),
    ("orang asli Papua", "IDN", 2),
    ("OAP", "IDN", 2),
    ("Persipura", "IDN", 2),
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

# Terms that were too ambiguous on their own (e.g. "Dani" is a common personal name).
# Seeding deactivates them; replacements with more context are listed above.
RETIRED_KEYWORDS = ["Dani", "Mee"]

# Stories matching any of these are never shown. Deliberately limited to promotional spam,
# adult content and explicit graphic-content warnings — reporting on conflict, violence or
# human rights in Papua must not be filtered out.
BLOCKED_KEYWORDS = [
    # Judi (promosi situs judi, sering disusupkan ke situs berita yang diretas)
    ("slot gacor", "gambling"),
    ("situs slot", "gambling"),
    ("agen slot", "gambling"),
    ("rtp slot", "gambling"),
    ("maxwin", "gambling"),
    ("bandar togel", "gambling"),
    ("situs togel", "gambling"),
    ("casino online", "gambling"),
    ("kasino online", "gambling"),
    # Spam / promosi
    ("link alternatif", "spam"),
    ("bonus new member", "spam"),
    ("deposit pulsa", "spam"),
    # Konten dewasa
    ("bokep", "adult"),
    ("porn", "adult"),
    ("xxx", "adult"),
    ("18+", "adult"),
    ("video mesum", "adult"),
    ("open BO", "adult"),
    # Peringatan konten grafis
    ("konten grafis", "graphic"),
    ("graphic content", "graphic"),
    ("graphic images", "graphic"),
]


class Command(BaseCommand):
    help = "Seed Papua keywords and the blocklist of unsafe terms"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing keywords and blocked terms before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            count = Keyword.objects.all().delete()[0]
            blocked_count = BlockedKeyword.objects.all().delete()[0]
            self.stdout.write(
                self.style.WARNING(f"Deleted {count} keywords and {blocked_count} blocked terms.")
            )

        created = updated = 0
        for term, region, weight in KEYWORDS:
            _, is_new = Keyword.objects.update_or_create(
                term=term,
                defaults={"region": region, "weight": weight, "is_active": True},
            )
            created += is_new
            updated += not is_new

        retired = Keyword.objects.filter(term__in=RETIRED_KEYWORDS, is_active=True).update(
            is_active=False
        )

        blocked_created = 0
        for term, category in BLOCKED_KEYWORDS:
            _, is_new = BlockedKeyword.objects.get_or_create(
                term=term, defaults={"category": category}
            )
            blocked_created += is_new

        self.stdout.write(
            self.style.SUCCESS(
                f"Keywords: {created} new, {updated} updated, {retired} retired. "
                f"Blocked terms: {blocked_created} new."
            )
        )
