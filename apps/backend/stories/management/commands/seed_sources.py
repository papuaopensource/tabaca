from urllib.parse import urlencode

from django.core.management.base import BaseCommand

from stories.models import Source
from stories.services import PICKS_SOURCE_DEFAULTS, PICKS_SOURCE_ID

# Tabaca is not a daily news site. These feeds are our picks of opinion, essays, analysis and
# research about Papua. Articles always have a thumbnail; papers get a cover in the extension.
# Single articles from any site can be added by hand ("Pilihan Tabaca"). After seeding,
# everything is managed from the admin panel (menu "Sumber").
WP_EMBED = "&_embed=wp:featuredmedia,author"

# Scholarly work from OpenAlex (open index of research): open access, with a DOI and an abstract,
# "Papua" in the title (excluding Papua New Guinea).
OPENALEX_BASE = 'title.search:papua NOT "new guinea",has_abstract:true,is_oa:true,has_doi:true'
OPENALEX_SELECT = "doi,title,publication_date,primary_location,authorships,abstract_inverted_index"


def openalex_url(filters: str, *, sort: str = "publication_date:desc", per_page: int = 50) -> str:
    query = {
        "filter": f"{OPENALEX_BASE},{filters}",
        "sort": sort,
        "per-page": str(per_page),
        "select": OPENALEX_SELECT,
    }
    return "https://api.openalex.org/works?" + urlencode(query)


# Research by Indonesian campuses (UNCEN, UNIPA, Musamus, UI, UGM, BRIN, …): authors affiliated
# with an Indonesian institution, one source per field so no field dominates, the 30 most cited
# since 2020 (thousands are published each year; citations surface the substantial ones).
# Political science is left out on purpose.
CAMPUS_FIELDS = [
    (
        "kampus-sosial-budaya",
        "Sosial & Budaya",
        "primary_topic.field.id:33|12,primary_topic.subfield.id:!3320",
    ),
    ("kampus-bisnis-ekonomi", "Bisnis & Ekonomi", "primary_topic.field.id:14|20"),
    ("kampus-teknologi", "Teknologi", "primary_topic.field.id:17|22"),
    ("kampus-lingkungan", "Lingkungan & Pertanian", "primary_topic.field.id:23|11|19"),
    ("kampus-kesehatan", "Kesehatan", "primary_topic.field.id:27|36|29"),
]


def campus_source(source_id: str, label: str, fields: str) -> dict:
    return {
        "id": source_id,
        "name": f"Kajian kampus Indonesia — {label} (OpenAlex)",
        "homepage": "https://openalex.org",
        "feed_url": openalex_url(
            "authorships.institutions.country_code:ID,from_publication_date:2020-01-01,"
            f"type:article|review,{fields}",
            sort="cited_by_count:desc",
            per_page=30,
        ),
        "allowed_domains": "doi.org",
        "papua_only": True,
    }


SOURCES = [
    {"id": PICKS_SOURCE_ID, **PICKS_SOURCE_DEFAULTS},
    *(campus_source(*field) for field in CAMPUS_FIELDS),
    {
        "id": "theconversation-papua",
        "name": "The Conversation Indonesia — Papua",
        "homepage": "https://theconversation.com/id",
        # Analysis by academics and researchers, topic "Papua".
        "feed_url": "https://theconversation.com/id/topics/papua-45091/articles.atom",
        "papua_only": True,
    },
    {
        "id": "sastrapapua",
        "name": "Sastra Papua",
        "homepage": "https://sastrapapua.org",
        # Komunitas Sastra Papua. Categories: Esai, Opini, Resensi, Kolom, Kolom Bahasa,
        # Budaya Papua, Sejarah (no fiction or poetry).
        "feed_url": (
            "https://sastrapapua.org/wp-json/wp/v2/posts"
            "?categories=34,50,31,454,138,230,508&per_page=50" + WP_EMBED
        ),
        "papua_only": True,
    },
    {
        "id": "kajian-jurnal",
        "name": "Kajian ilmiah — Jurnal (OpenAlex)",
        "homepage": "https://openalex.org",
        # Journal articles and reviews in DOAJ-listed journals; social sciences, arts &
        # humanities, environmental science and economics.
        "feed_url": openalex_url(
            "from_publication_date:2022-01-01,type:article|review,"
            "primary_topic.field.id:33|12|23|20,primary_location.source.is_in_doaj:true"
        ),
        "allowed_domains": "doi.org",
        "papua_only": True,
    },
    {
        "id": "kajian-buku-laporan",
        "name": "Kajian ilmiah — Buku & laporan (OpenAlex)",
        "homepage": "https://openalex.org",
        # Books, chapters (e.g. ANU Press) and research reports; also biology for
        # biodiversity surveys. Excludes Atlantis Press conference proceedings.
        "feed_url": openalex_url(
            "from_publication_date:2015-01-01,type:book|book-chapter|report,"
            "primary_topic.field.id:33|12|23|20|11,"
            "primary_location.source.host_organization:!P4310315540"
        ),
        "allowed_domains": "doi.org",
        "papua_only": True,
    },
    {
        "id": "suara-papua-opini",
        "name": "Suara Papua — Opini",
        "homepage": "https://suarapapua.com",
        # Categories: Opini, Kolom Redaksi, Catatan Aktivis/Jurnalis/Advokat Papua.
        "feed_url": (
            "https://suarapapua.com/wp-json/wp/v2/posts"
            "?categories=264,260,2514,3285,22772&per_page=50" + WP_EMBED
        ),
    },
    {
        "id": "laolao-papua",
        "name": "Lao-Lao Papua",
        "homepage": "https://laolaopapua.com",
        # Essays and critique. Leaves out non-article posts: press releases (72), Lao-Lao TV
        # (31), discussions/webinars (379), interviews (380), video (382) and book promotion
        # (776, 777). Strict relevance drops general theory pieces that only mention Papua.
        "feed_url": (
            "https://laolaopapua.com/wp-json/wp/v2/posts?per_page=50"
            "&categories_exclude=72,31,379,380,382,776,777" + WP_EMBED
        ),
        "strict_relevance": True,
    },
    {
        "id": "mojok-esai",
        "name": "Mojok — Esai",
        "homepage": "https://mojok.co",
        # Categories: Esai, Kolom; only posts that mention Papua.
        "feed_url": (
            "https://mojok.co/wp-json/wp/v2/posts?categories=3,18280&search=papua&per_page=50"
            + WP_EMBED
        ),
    },
    {
        "id": "newmandala",
        "name": "New Mandala",
        "homepage": "https://www.newmandala.org",
        # Academic analysis of Southeast Asia (ANU); posts about West Papua.
        "feed_url": (
            "https://www.newmandala.org/wp-json/wp/v2/posts?search=west%20papua&per_page=50"
            + WP_EMBED
        ),
    },
    {
        "id": "asiapacificreport-commentary",
        "name": "Asia Pacific Report — Commentary",
        "homepage": "https://asiapacificreport.nz",
        "feed_url": (
            "https://asiapacificreport.nz/wp-json/wp/v2/posts"
            "?categories=15945&search=papua&per_page=50" + WP_EMBED
        ),
    },
    {
        "id": "daenggassing",
        "name": "DaengGassing.com",
        "homepage": "https://daenggassing.com",
        # A general-interest blog whose RSS feeds all redirect to one FeedBurner feed, so we use
        # the WordPress REST API for its "Papua" category (id 1769) instead.
        "feed_url": (
            "https://daenggassing.com/wp-json/wp/v2/posts?categories=1769&per_page=100" + WP_EMBED
        ),
        "papua_only": True,
    },
    {
        "id": "antara-papua-artikel",
        "name": "Antara Papua — Artikel",
        "homepage": "https://papua.antaranews.com",
        # Feature articles only (the other Antara feeds are daily news).
        "feed_url": "https://papua.antaranews.com/rss/artikel.xml",
        "papua_only": True,
    },
]

# Earlier defaults: daily news, blocked (Jubi: HTTP 403), or not about Papua often enough.
# Seeding switches them off (their stories disappear from the API); delete them in the admin
# panel if you no longer need their history.
RETIRED_SOURCE_IDS = [
    "jubi",
    "suara-papua",
    "bbc",
    "bbc-indonesia",
    "antara-papua",
    "theconversation",
    "theconversation-id",
]


class Command(BaseCommand):
    help = "Seed the default feeds (existing feeds keep their active/inactive state)"

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for data in SOURCES:
            fields = {k: v for k, v in data.items() if k not in ("id", "is_active")}
            _, is_new = Source.objects.update_or_create(
                id=data["id"],
                defaults=fields,
                create_defaults={**fields, "is_active": data.get("is_active", True)},
            )
            if is_new:
                created += 1
            else:
                updated += 1

        retired = Source.objects.filter(id__in=RETIRED_SOURCE_IDS, is_active=True).update(
            is_active=False
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created} new, {updated} updated sources; {retired} retired."
            )
        )
