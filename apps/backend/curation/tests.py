import pytest
from django.core.management import call_command

from .filter import Curator, filter_by_papua_scope
from .models import BlockedKeyword, Keyword

CURATOR = Curator.from_terms(
    keywords=[
        ("Papua", "BOTH", 1),
        ("West Papua", "IDN", 2),
        ("Jayapura", "IDN", 2),
        ("Papua New Guinea", "PNG", 1),
        ("Port Moresby", "PNG", 2),
    ],
    blocked=["slot gacor", "18+", "konten grafis"],
)


def test_passes_papua_story():
    result = CURATOR.evaluate("Protes di Jayapura soal tambang")
    assert result["passes"]
    assert result["matched_keywords"] == ["Jayapura"]
    assert result["region"] == "IDN"


def test_rejects_unrelated_story():
    result = CURATOR.evaluate("Parlemen Inggris memilih RUU ekonomi baru")
    assert not result["passes"]
    assert result["matched_keywords"] == []


def test_png_region():
    result = CURATOR.evaluate("Election day in Port Moresby")
    assert result["passes"]
    assert result["region"] == "PNG"


def test_matches_whole_words_only():
    assert not CURATOR.evaluate("Papuanesque design trends")["passes"]


def test_case_insensitive():
    assert CURATOR.evaluate("NEWS FROM JAYAPURA")["passes"]


def test_blocked_term_rejects_even_if_relevant():
    result = CURATOR.evaluate("Link SLOT GACOR Papua hari ini")
    assert not result["passes"]
    assert result["blocked_by"] == ["slot gacor"]


def test_blocked_term_with_punctuation():
    assert CURATOR.blocked_terms("Video 18+ dari Papua") == ["18+"]
    assert CURATOR.blocked_terms("Usia 18 tahun di Papua") == []


def test_blocklist_checks_extra_text():
    result = CURATOR.evaluate("Berita Papua", extra_block_text="2026 11 slot gacor terbaru")
    assert not result["passes"]


@pytest.mark.django_db
def test_from_db_ignores_inactive_terms():
    Keyword.objects.create(term="Wamena", region="IDN", weight=2)
    Keyword.objects.create(term="Merauke", region="IDN", weight=2, is_active=False)
    BlockedKeyword.objects.create(term="bokep", category="adult", is_active=False)

    assert filter_by_papua_scope("Pasar di Wamena")["passes"]
    assert not filter_by_papua_scope("Pasar di Merauke")["passes"]
    assert filter_by_papua_scope("Wamena bokep")["passes"]


@pytest.mark.django_db
def test_seed_keywords_retires_ambiguous_terms_and_keeps_blocklist_edits():
    Keyword.objects.create(term="Dani", region="IDN", weight=1)
    call_command("seed_keywords")
    assert not Keyword.objects.get(term="Dani").is_active
    assert Keyword.objects.get(term="suku Dani").is_active
    assert BlockedKeyword.objects.filter(category="gambling").exists()

    # An admin disabling a blocked term must survive re-seeding.
    BlockedKeyword.objects.filter(term="xxx").update(is_active=False)
    call_command("seed_keywords")
    assert not BlockedKeyword.objects.get(term="xxx").is_active


STRICT = Curator.from_terms(
    keywords=[("Papua", "BOTH", 1), ("Maybrat", "IDN", 2), ("Sorong", "IDN", 2)],
)


def test_outlet_name_is_not_relevance():
    snippet = "Pengantar Redaksi Lao-Lao Papua tentang Marxisme di Amerika Latin."
    assert STRICT.evaluate(snippet, title="Mariátegui dan Marxisme")["passes"]
    assert not STRICT.evaluate(snippet, title="Mariátegui dan Marxisme", ignore=["Lao-Lao Papua"])[
        "passes"
    ]


def test_strict_relevance_needs_papua_in_title_or_a_clear_summary():
    one_mention = "Teori revolusi; beberapa tahun terakhir Papua mengalami perlawanan."
    assert STRICT.evaluate(one_mention, title="Memperjelas Sosialisme Ilmiah")["passes"]
    assert not STRICT.evaluate(one_mention, title="Memperjelas Sosialisme Ilmiah", strict=True)[
        "passes"
    ]
    # Papua in the title is enough.
    assert STRICT.evaluate("Kritik.", title="Kritik Terhadap Agama di Papua", strict=True)["passes"]
    # A summary clearly about Papua is enough too.
    clear = "Suku bangsa di tanah Papua, Kabupaten Maybrat dan Sorong Selatan."
    assert STRICT.evaluate(clear, title="Memahami Dunia Suku A3 dan Sawiat", strict=True)["passes"]
