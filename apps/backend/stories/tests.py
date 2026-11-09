import ssl

import feedparser
import pytest
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from curation.filter import Curator

from .admin import AddStoryForm
from .feeds import (
    build_ssl_context,
    clean_summary,
    hash_url,
    normalize_entry,
    strip_tracking,
    url_words,
    wordpress_entries,
)
from .models import FetchLog, Source, Story
from .pages import PageMeta, parse_page_meta
from .safety import is_safe_link, safe_image_url
from .services import (
    PICKS_SOURCE_ID,
    PickError,
    add_pick,
    build_pick,
    fetch_source,
    recheck_stories,
)

CURATOR = Curator.from_terms(
    keywords=[("Papua", "BOTH", 1), ("Jayapura", "IDN", 2)],
    blocked=["slot gacor"],
)

FEED = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Suara Papua</title>
  <item>
    <title>Warga Jayapura gelar aksi damai</title>
    <link>https://suarapapua.com/2026/11/09/aksi-damai/</link>
    <description><![CDATA[<p>Aksi berlangsung <b>tertib</b> di Jayapura.</p>]]></description>
    <pubDate>Mon, 09 Nov 2026 08:00:00 +0900</pubDate>
    <author>Redaksi</author>
    <media:content url="https://suarapapua.com/img/aksi.jpg" medium="image" />
  </item>
  <item>
    <title>Harga BBM naik di Jakarta</title>
    <link>https://suarapapua.com/2026/11/09/bbm/</link>
    <description>Tidak terkait.</description>
  </item>
  <item>
    <title>Papua: link terbaru</title>
    <link>https://suarapapua.com/2026/11/09/slot-gacor-hari-ini/</link>
    <description>Spam yang disusupkan.</description>
  </item>
  <item>
    <title>Kabar Papua dari situs lain</title>
    <link>https://evil.example.com/papua</link>
    <description>Papua</description>
  </item>
  <item>
    <title>Papua tanpa gambar aman</title>
    <link>https://www.suarapapua.com/2026/11/09/gambar/</link>
    <description><![CDATA[<img src="http://insecure.example/a.jpg"> Papua]]></description>
  </item>
</channel>
</rss>
"""


@pytest.fixture
def source(db):
    return Source.objects.create(
        id="suara-papua",
        name="Suara Papua",
        homepage="https://suarapapua.com",
        feed_url="https://suarapapua.com/feed/",
    )


def fake_fetch(_url):
    return feedparser.parse(FEED).entries


AKSI = "https://suarapapua.com/2026/11/09/aksi-damai/"


def fake_meta(url):
    """Pretends every article page has an https preview image."""
    return PageMeta(image=f"{url.rstrip('/')}/og.jpg")


def no_meta(_url):
    raise OSError("offline")


def make_story(source, **kwargs):
    defaults = {
        "id": kwargs.get("url", "x")[-16:],
        "title": "Berita Papua",
        "url": "https://suarapapua.com/berita",
        "source": source,
        "published_at": timezone.now(),
        "snippet": "Papua",
        "image_url": "https://suarapapua.com/img.jpg",
    }
    return Story.objects.create(**{**defaults, **kwargs})


# Safety helpers


def test_is_safe_link():
    allowed = ["suarapapua.com"]
    assert is_safe_link("https://suarapapua.com/a", allowed)
    assert is_safe_link("https://www.suarapapua.com/a", allowed)
    assert is_safe_link("http://news.suarapapua.com/a", allowed)
    assert not is_safe_link("https://suarapapua.com.evil.io/a", allowed)
    assert not is_safe_link("https://evilsuarapapua.com/a", allowed)
    assert not is_safe_link("javascript:alert(1)", allowed)
    assert not is_safe_link("https://user:pw@suarapapua.com/a", allowed)


def test_safe_image_url():
    assert safe_image_url("https://cdn.example/a.jpg") == "https://cdn.example/a.jpg"
    assert safe_image_url("https://counter.theconversation.com/content/1/count.gif") == ""
    assert safe_image_url("https://pixel.wp.com/g.gif?blog=1") == ""
    assert safe_image_url("http://cdn.example/a.jpg") == ""
    assert safe_image_url("data:image/png;base64,AAA") == ""


def test_source_allowed_domains(db):
    bbc = Source(homepage="https://www.bbc.com/indonesia", allowed_domains="bbc.com,\nBBC.co.uk")
    assert bbc.get_allowed_domains() == ["bbc.com", "bbc.co.uk"]
    jubi = Source(homepage="https://www.jubi.id")
    assert jubi.get_allowed_domains() == ["jubi.id"]


# Feed parsing


def test_normalize_entry():
    entry = fake_fetch("")[0]
    raw = normalize_entry(entry)
    assert raw["title"] == "Warga Jayapura gelar aksi damai"
    assert raw["snippet"] == "Aksi berlangsung tertib di Jayapura."
    assert raw["image_url"] == "https://suarapapua.com/img/aksi.jpg"
    assert raw["author"] == "Redaksi"
    assert raw["published_at"].isoformat() == "2026-11-08T23:00:00+00:00"


def test_image_from_wordpress_content():
    entry = feedparser.parse(
        """<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
        <item><title>T</title><link>https://laolaopapua.com/a</link>
        <description>Ringkasan</description>
        <content:encoded><![CDATA[<p>Isi</p>
        <img src="https://mmg.whatsapp.net/v/t62/863_n.enc?ccb=11-4&amp;oh=01"/>
        <img src="https://laolaopapua.com/wp/a.jpg?w=800&amp;h=600"/>]]>
        </content:encoded></item></channel></rss>"""
    ).entries[0]
    assert normalize_entry(entry)["image_url"] == "https://laolaopapua.com/wp/a.jpg?w=800&h=600"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (
            "Rapat kerja digelar di Tondano. Dalam arahan [&#8230;]",
            "Rapat kerja digelar di Tondano. Dalam arahan…",
        ),
        ("Isi ringkasan [...]", "Isi ringkasan…"),
        ("Isi. The post Judul appeared first on Suara Papua.", "Isi."),
        ("Isi ringkasan. Baca selengkapnya", "Isi ringkasan."),
        (
            "Read more about Papua forests in this report.",
            "Read more about Papua forests in this report.",
        ),
    ],
)
def test_clean_summary(raw, expected):
    from .feeds import html_to_text

    assert clean_summary(html_to_text(raw)) == expected


def test_image_skips_tracking_pixels_and_avatars():
    entry = feedparser.parse(
        """<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>T</title>
        <link href="https://theconversation.com/a-1"/>
        <content type="html">&lt;img src="https://counter.theconversation.com/content/1/count.gif"
        width="1" height="1"&gt;&lt;img src="https://secure.gravatar.com/avatar/x.jpg"&gt;
        &lt;img src="https://images.theconversation.com/files/1/original/file.jpg?ixlib=rb"&gt;
        </content></entry></feed>"""
    ).entries[0]
    assert (
        normalize_entry(entry)["image_url"]
        == "https://images.theconversation.com/files/1/original/file.jpg?ixlib=rb"
    )


def test_strip_tracking():
    assert (
        strip_tracking("https://daenggassing.com/opini/a/?utm_source=rss&utm_medium=rss")
        == "https://daenggassing.com/opini/a/"
    )
    assert strip_tracking("https://x.id/a?id=7&fbclid=abc&page=2") == "https://x.id/a?id=7&page=2"
    assert strip_tracking("https://x.id/a") == "https://x.id/a"


WP_POSTS = [
    {
        "link": "https://daenggassing.com/perjalanan/senja-di-kaimana/?utm_source=rss",
        "date_gmt": "2021-12-11T03:15:00",
        "title": {"rendered": "Menikmati Senja Kaimana &#8211; Papua Barat"},
        "excerpt": {"rendered": "<p>Senja di Kaimana memang indah [&hellip;]</p>"},
        "_embedded": {
            "author": [{"name": "Daeng Ipul"}],
            "wp:featuredmedia": [{"source_url": "https://daenggassing.com/wp/kaimana.jpg"}],
        },
    },
    {"link": "https://daenggassing.com/a/", "title": {"rendered": "Tanpa gambar"}},
    "not a post",
]


def test_wordpress_entries_match_feed_entries():
    first, second = wordpress_entries(WP_POSTS)
    raw = normalize_entry(first)
    assert raw["url"] == "https://daenggassing.com/perjalanan/senja-di-kaimana/"
    assert raw["title"] == "Menikmati Senja Kaimana – Papua Barat"
    assert raw["snippet"] == "Senja di Kaimana memang indah…"
    assert raw["author"] == "Daeng Ipul"
    assert raw["image_url"] == "https://daenggassing.com/wp/kaimana.jpg"
    assert raw["published_at"].isoformat() == "2021-12-11T03:15:00+00:00"
    assert normalize_entry(second)["image_url"] == ""


def test_wordpress_entries_rejects_other_json():
    with pytest.raises(Exception, match="WordPress"):
        wordpress_entries({"error": "nope"})


def test_ssl_context_loads_extra_intermediates():
    default = ssl.create_default_context().cert_store_stats()["x509_ca"]
    extended = build_ssl_context().cert_store_stats()["x509_ca"]
    assert extended == default + 2


def test_url_words():
    assert url_words("https://x.id/2026/11/slot-gacor_hari.ini/") == "2026 11 slot gacor hari ini"


# Fetching


def test_fetch_source_keeps_only_safe_papua_stories(source):
    result = fetch_source(source, CURATOR, fetch=fake_fetch, fetch_meta=fake_meta)

    assert result.error == ""
    assert result.story_count == 2
    assert result.new_count == 2
    assert result.rejected_count == 2  # spam slug + foreign domain

    stories = {s.url: s for s in Story.objects.all()}
    assert set(stories) == {
        "https://suarapapua.com/2026/11/09/aksi-damai/",
        "https://www.suarapapua.com/2026/11/09/gambar/",
    }
    assert stories["https://suarapapua.com/2026/11/09/aksi-damai/"].matched_keywords == ["Jayapura"]
    # The feed's image was http, so the article page's preview image is used instead.
    assert (
        stories["https://www.suarapapua.com/2026/11/09/gambar/"].image_url
        == "https://www.suarapapua.com/2026/11/09/gambar/og.jpg"
    )

    log = FetchLog.objects.get()
    assert (log.story_count, log.new_count, log.rejected_count) == (2, 2, 2)

    # Second run is idempotent.
    assert fetch_source(source, CURATOR, fetch=fake_fetch, fetch_meta=fake_meta).new_count == 0


def test_fetch_source_fills_missing_thumbnail_of_existing_story(source):
    make_story(source, id=hash_url(AKSI), url=AKSI, image_url="")
    fetch_source(source, CURATOR, fetch=fake_fetch, fetch_meta=no_meta)
    assert Story.objects.get(url=AKSI).image_url == "https://suarapapua.com/img/aksi.jpg"


def test_fetch_source_repairs_tracking_pixel_thumbnail(source):
    gambar = "https://www.suarapapua.com/2026/11/09/gambar/"
    make_story(
        source,
        id=hash_url(gambar),
        url=gambar,
        image_url="https://counter.theconversation.com/content/1/count.gif",
    )
    fetch_source(source, CURATOR, fetch=fake_fetch, fetch_meta=fake_meta)
    assert Story.objects.get(url=gambar).image_url == gambar + "og.jpg"


def test_fetch_source_skips_stories_without_thumbnail(source):
    result = fetch_source(source, CURATOR, fetch=fake_fetch, fetch_meta=no_meta)
    assert result.new_count == 1
    assert Story.objects.get().url == "https://suarapapua.com/2026/11/09/aksi-damai/"


def test_papua_only_feed_skips_keyword_filter(source):
    source.papua_only = True
    source.save()
    fetch_source(source, CURATOR, fetch=fake_fetch, fetch_meta=fake_meta)
    titles = set(Story.objects.values_list("title", flat=True))
    assert "Harga BBM naik di Jakarta" in titles
    # Safety still applies: spam and foreign links stay out.
    assert len(titles) == 3


def test_manual_source_is_not_fetched(db):
    manual = Source.objects.create(id="pilihan", name="Pilihan", homepage="https://x.id")
    assert manual.is_manual
    result = fetch_source(manual, CURATOR, fetch=fake_fetch)
    assert (result.story_count, result.error) == (0, "")
    assert not FetchLog.objects.exists()


def test_fetch_source_records_errors(source):
    def broken(_url):
        raise OSError("HTTP Error 403: Forbidden")

    result = fetch_source(source, CURATOR, fetch=broken)
    source.refresh_from_db()
    assert result.error == "HTTP Error 403: Forbidden"
    assert source.last_error == "HTTP Error 403: Forbidden"
    assert FetchLog.objects.get().error == "HTTP Error 403: Forbidden"


def test_recheck_stories_hides_newly_blocked_and_foreign_links(source):
    ok = make_story(source, id="ok", url="https://suarapapua.com/ok")
    spam = make_story(source, id="spam", url="https://suarapapua.com/s", title="Papua slot gacor")
    foreign = make_story(source, id="foreign", url="https://elsewhere.example/papua")
    insecure_img = make_story(
        source, id="img", url="https://suarapapua.com/img", image_url="http://x.example/a.jpg"
    )

    picks = Source.objects.create(id="pilihan", name="Pilihan", homepage="https://x.id")
    pick = make_story(picks, id="pick", url="https://yose.is-a.dev/id/blog/a/")

    result = recheck_stories(CURATOR)

    assert result.deactivated == 3
    for story in (ok, spam, foreign, insecure_img, pick):
        story.refresh_from_db()
    assert ok.is_active
    # Hand-picked articles can come from any site.
    assert pick.is_active
    assert not spam.is_active and not foreign.is_active
    # Every story needs a safe thumbnail.
    assert not insecure_img.is_active


# Seeding


@pytest.mark.django_db
def test_seed_sources_preserves_admin_activation():
    Source.objects.create(
        id="jubi", name="Jubi", homepage="https://jubi.id", feed_url="https://jubi.id/feed/"
    )
    call_command("seed_sources")
    assert Source.objects.get(id="theconversation-papua").papua_only
    assert Source.objects.filter(id="suara-papua-opini", is_active=True).exists()
    assert Source.objects.get(id=PICKS_SOURCE_ID).is_manual
    # Retired defaults (daily news, blocked feeds) are switched off.
    assert not Source.objects.get(id="jubi").is_active

    campus = Source.objects.filter(id__startswith="kampus-")
    assert campus.count() == 5
    assert all(
        "country_code%3AID" in s.feed_url and "cited_by_count%3Adesc" in s.feed_url for s in campus
    )
    assert "subfield.id%3A%213320" in Source.objects.get(id="kampus-sosial-budaya").feed_url

    laolao = Source.objects.get(id="laolao-papua")
    assert laolao.strict_relevance and "categories_exclude=" in laolao.feed_url

    Source.objects.filter(id="mojok-esai").update(is_active=False)
    call_command("seed_sources")
    assert not Source.objects.get(id="mojok-esai").is_active


# API


@pytest.mark.django_db
def test_api_hides_inactive_sources_and_their_stories(source):
    hidden_source = Source.objects.create(
        id="hidden",
        name="Hidden",
        homepage="https://hidden.example",
        feed_url="https://hidden.example/feed",
        is_active=False,
    )
    make_story(source, id="visible", url="https://suarapapua.com/v")
    make_story(hidden_source, id="hidden", url="https://hidden.example/h")
    make_story(source, id="inactive", url="https://suarapapua.com/i", is_active=False)
    make_story(source, id="noimage", url="https://suarapapua.com/n", image_url="")

    client = APIClient()
    stories = client.get("/api/v1/stories/?page_size=200").json()
    assert [s["id"] for s in stories["results"]] == ["visible"]
    assert stories["results"][0]["source"] == "suara-papua"
    assert "publishedAt" in stories["results"][0]

    sources = client.get("/api/v1/sources/").json()
    assert [s["id"] for s in sources["results"]] == ["suara-papua"]
    assert sources["results"][0]["storyCount"] == 1
    assert {"description", "language", "color"}.isdisjoint(sources["results"][0])


# Admin


@pytest.mark.parametrize(
    "path",
    [
        "/site-manager/",
        "/site-manager/stories/source/",
        "/site-manager/stories/source/add/",
        "/site-manager/stories/source/suara-papua/change/",
        "/site-manager/stories/story/",
        "/site-manager/stories/fetchlog/",
        "/site-manager/curation/keyword/",
        "/site-manager/curation/blockedkeyword/",
    ],
)
def test_admin_pages_render(admin_client, source, path):
    make_story(source, id="s1", url="https://suarapapua.com/s1")
    assert admin_client.get(path).status_code == 200


def test_admin_fetch_now_action(admin_client, source, monkeypatch):
    monkeypatch.setattr(
        "stories.admin.fetch_source",
        lambda src, _curator: fetch_source(src, CURATOR, fetch=fake_fetch, fetch_meta=fake_meta),
    )
    response = admin_client.post(
        "/site-manager/stories/source/",
        {"action": "fetch_now", "_selected_action": ["suara-papua"], "index": 0},
        follow=True,
    )
    assert response.status_code == 200
    assert "2 lolos filter" in response.content.decode()
    assert Story.objects.filter(source=source).count() == 2


# Read counter


@pytest.mark.django_db
def test_read_counter_increments_and_is_exposed(source):
    make_story(source, id="s1", url="https://suarapapua.com/s1")
    client = APIClient()

    assert client.post("/api/v1/stories/s1/read/").json() == {"readCount": 1}
    assert client.post("/api/v1/stories/s1/read/").json() == {"readCount": 2}
    story = client.get("/api/v1/stories/s1/").json()
    assert story["readCount"] == 2


@pytest.mark.django_db
def test_read_counter_ignores_hidden_stories(source):
    make_story(source, id="hidden", url="https://suarapapua.com/h", is_active=False)
    assert APIClient().post("/api/v1/stories/hidden/read/").status_code == 404
    assert Story.objects.get(id="hidden").read_count == 0


@pytest.mark.django_db
def test_read_counter_is_read_only_otherwise(source):
    make_story(source, id="s1", url="https://suarapapua.com/s1")
    client = APIClient()
    assert client.get("/api/v1/stories/s1/read/").status_code == 405
    assert client.delete("/api/v1/stories/s1/").status_code == 405


# Page metadata and hand-picked articles

ARTICLE_HTML = """<html><head>
<title>Fallback title</title>
<meta property="og:title" content="Sindrom Seremonial: Pesawat yang Tidak Pernah Tiba">
<meta property="og:description" content="Cargo cult bukan cuma di PNG dulu.">
<meta property="og:image" content="/images/social-card.png">
<meta property="article:author" content="Yose Marthin Giyay">
<meta property="article:published_time" content="2026-05-07T00:00:00.000Z">
</head><body></body></html>"""

ARTICLE_URL = "https://yose.is-a.dev/id/blog/sindrom-seremonial/?utm_source=x"


def test_parse_page_meta():
    meta = parse_page_meta(ARTICLE_HTML, "https://yose.is-a.dev/id/blog/sindrom-seremonial/")
    assert meta.title == "Sindrom Seremonial: Pesawat yang Tidak Pernah Tiba"
    assert meta.description == "Cargo cult bukan cuma di PNG dulu."
    assert meta.image == "https://yose.is-a.dev/images/social-card.png"
    assert meta.author == "Yose Marthin Giyay"
    assert meta.published_at.isoformat() == "2026-05-07T00:00:00+00:00"


def article_meta(url):
    return parse_page_meta(ARTICLE_HTML, url)


@pytest.mark.django_db
def test_add_pick_from_any_site():
    story, created = add_pick(ARTICLE_URL, curator=CURATOR, fetch_meta=article_meta)
    assert created
    assert story.source_id == PICKS_SOURCE_ID
    assert story.url == "https://yose.is-a.dev/id/blog/sindrom-seremonial/"
    assert story.image_url == "https://yose.is-a.dev/images/social-card.png"
    assert story.author == "Yose Marthin Giyay"
    assert story.published_at.year == 2026
    # Picked by an admin: no Papua keyword is required.
    assert story.is_active

    again, created = add_pick(ARTICLE_URL, curator=CURATOR, fetch_meta=article_meta)
    assert (again.pk, created) == (story.pk, False)


@pytest.mark.django_db
def test_build_pick_rules():
    with pytest.raises(PickError, match="http"):
        build_pick("javascript:alert(1)", curator=CURATOR, fetch_meta=article_meta)
    with pytest.raises(PickError, match="Thumbnail"):
        build_pick("https://x.id/a", curator=CURATOR, fetch_meta=lambda _u: PageMeta(title="Papua"))
    with pytest.raises(PickError, match="terlarang"):
        build_pick(
            "https://x.id/a",
            title="Papua slot gacor",
            curator=CURATOR,
            fetch_meta=article_meta,
        )
    # Overrides work even when the page can't be opened.
    fields = build_pick(
        "https://x.id/a",
        title="Esai Papua",
        image_url="https://x.id/a.jpg",
        curator=CURATOR,
        fetch_meta=no_meta,
    )
    assert (fields["title"], fields["image_url"]) == ("Esai Papua", "https://x.id/a.jpg")


def test_admin_add_story_by_url(admin_client, monkeypatch):
    monkeypatch.setattr(
        "stories.admin.build_pick",
        lambda url, **kw: build_pick(url, **kw, curator=CURATOR, fetch_meta=article_meta),
    )
    page = admin_client.get("/site-manager/stories/story/add/")
    assert page.status_code == 200

    response = admin_client.post(
        "/site-manager/stories/story/add/",
        {"url": ARTICLE_URL, "title": "", "snippet": "", "image_url": ""},
        follow=True,
    )
    assert response.status_code == 200
    story = Story.objects.get()
    assert story.title == "Sindrom Seremonial: Pesawat yang Tidak Pernah Tiba"
    assert story.source_id == PICKS_SOURCE_ID

    duplicate = AddStoryForm(data={"url": ARTICLE_URL})
    assert not duplicate.is_valid()
    assert "sudah ada" in str(duplicate.errors)


# Papers (OpenAlex, scholarly pages)

OPENALEX = {
    "meta": {"count": 2},
    "results": [
        {
            "doi": "https://doi.org/10.1234/noken.2026",
            "title": "Reconstructing the <i>Noken</i> Election in Papua",
            "publication_date": "2026-11-01",
            "abstract_inverted_index": {"The": [0], "noken": [1, 4], "system": [2], "and": [3]},
            "authorships": [{"author": {"display_name": f"Author {i}"}} for i in range(1, 5)],
            "primary_location": {"source": {"display_name": "SASI"}},
        },
        {"doi": None, "title": "No DOI, skipped"},
    ],
}


def test_clean_venue():
    from .feeds import clean_venue

    assert clean_venue("Advances in X research/Advances in X Research") == "Advances in X Research"
    assert clean_venue("Jurnal Ilmu Sosial/Humaniora") == "Jurnal Ilmu Sosial/Humaniora"
    assert clean_venue("Zenodo (CERN European Organization for Nuclear Research)") == "Zenodo"


def test_openalex_entries():
    from .feeds import openalex_entries

    (entry,) = openalex_entries(OPENALEX)
    raw = normalize_entry(entry)
    assert raw["url"] == "https://doi.org/10.1234/noken.2026"
    assert raw["title"] == "Reconstructing the Noken Election in Papua"
    assert raw["snippet"] == "The noken system and noken"
    assert raw["author"] == "Author 1, Author 2, Author 3 et al."
    assert (raw["kind"], raw["venue"]) == ("paper", "SASI")
    assert raw["image_url"] == ""


@pytest.mark.django_db
def test_papers_are_kept_without_thumbnail_and_served():
    from .feeds import openalex_entries

    papers = Source.objects.create(
        id="kajian",
        name="Kajian",
        homepage="https://openalex.org",
        feed_url="https://api.openalex.org/works",
        allowed_domains="doi.org",
    )
    result = fetch_source(
        papers, CURATOR, fetch=lambda _u: openalex_entries(OPENALEX), fetch_meta=no_meta
    )
    assert result.new_count == 1
    paper = Story.objects.get()
    assert (paper.kind, paper.venue, paper.image_url) == ("paper", "SASI", "")

    assert recheck_stories(CURATOR).deactivated == 0

    body = APIClient().get("/api/v1/stories/").json()
    assert body["results"][0]["kind"] == "paper"
    assert body["results"][0]["venue"] == "SASI"


SCHOLAR_HTML = """<html><head>
<meta name="citation_title" content="Etnoekologi Sistem Bera di Papua">
<meta name="citation_journal_title" content="Jurnal Ilmu Lingkungan">
<meta name="citation_author" content="A. Wenda"><meta name="citation_author" content="B. Kogoya">
<meta name="citation_publication_date" content="2026/10/02">
<meta name="DC.Description" content="Kajian sistem bera pada pertanian masyarakat adat.">
</head></html>"""


@pytest.mark.django_db
def test_pick_a_paper_without_image():
    meta = parse_page_meta(SCHOLAR_HTML, "https://ejournal.example.ac.id/article/1")
    assert (meta.is_paper, meta.venue, meta.author) == (
        True,
        "Jurnal Ilmu Lingkungan",
        "A. Wenda, B. Kogoya",
    )
    assert meta.published_at.isoformat() == "2026-10-02T00:00:00+00:00"

    story, _ = add_pick(
        "https://ejournal.example.ac.id/article/1",
        curator=CURATOR,
        fetch_meta=lambda u: parse_page_meta(SCHOLAR_HTML, u),
    )
    assert (story.kind, story.venue, story.image_url) == ("paper", "Jurnal Ilmu Lingkungan", "")


@pytest.mark.django_db
def test_pick_a_report_marked_as_publication():
    # e.g. a PDF report: no preview metadata, so title/publisher are given by the admin.
    fields = build_pick(
        "https://understandingconflict.org/report.pdf",
        title="Papua conflict report",
        kind="paper",
        venue="IPAC",
        curator=CURATOR,
        fetch_meta=lambda _u: PageMeta(),
    )
    assert (fields["kind"], fields["venue"], fields["image_url"]) == ("paper", "IPAC", "")
