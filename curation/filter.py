import re
from typing import TypedDict


class FilterResult(TypedDict):
    passes: bool
    score: int
    matched_keywords: list[str]
    region: str | None


def _escape_regex(term: str) -> str:
    return re.escape(term)


def filter_by_papua_scope(text: str) -> FilterResult:
    from .models import Keyword

    keywords = Keyword.objects.filter(is_active=True).values("term", "region", "weight")

    matched: list[str] = []
    score = 0
    has_idn = False
    has_png = False

    for kw in keywords:
        pattern = re.compile(rf"\b{_escape_regex(kw['term'])}\b", re.IGNORECASE)
        if pattern.search(text):
            matched.append(kw["term"])
            score += kw["weight"]
            if kw["region"] in ("IDN", "BOTH"):
                has_idn = True
            if kw["region"] in ("PNG", "BOTH"):
                has_png = True

    if score < 1:
        return {"passes": False, "score": 0, "matched_keywords": [], "region": None}

    region = "IDN" if has_idn else "PNG"

    return {
        "passes": True,
        "score": score,
        "matched_keywords": list(dict.fromkeys(matched)),  # deduplicate, preserve order
        "region": region,
    }
