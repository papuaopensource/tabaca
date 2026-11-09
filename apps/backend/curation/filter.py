import re
from dataclasses import dataclass, field
from typing import TypedDict


class FilterResult(TypedDict):
    passes: bool
    score: int
    matched_keywords: list[str]
    region: str | None
    blocked_by: list[str]


# With strict relevance, a story that doesn't name Papua in its title needs this much evidence
# in its summary (e.g. "Papua" + a regency), not a single passing mention.
STRICT_BODY_SCORE = 3


def remove_phrases(text: str, phrases) -> str:
    """Drops e.g. the outlet's own name ("Lao-Lao Papua", "suarapapua.com") before scoring."""
    for phrase in phrases:
        if phrase:
            text = re.sub(re.escape(phrase), " ", text, flags=re.IGNORECASE)
    return text


def compile_term(term: str) -> re.Pattern[str]:
    # Lookarounds instead of \b so terms that start/end with punctuation (e.g. "18+") still match
    # as whole words.
    return re.compile(rf"(?<!\w){re.escape(term.strip())}(?!\w)", re.IGNORECASE)


@dataclass(frozen=True)
class _Term:
    term: str
    pattern: re.Pattern[str]
    weight: int = 0
    region: str = ""


@dataclass
class Curator:
    """Decides whether a story is about Papua and safe to show.

    Build it once per run (``Curator.from_db()``) so keywords are loaded and compiled a single
    time instead of on every story.
    """

    keywords: list[_Term] = field(default_factory=list)
    blocked: list[_Term] = field(default_factory=list)

    @classmethod
    def from_terms(cls, keywords=(), blocked=()) -> "Curator":
        """``keywords``: iterable of (term, region, weight); ``blocked``: iterable of terms."""
        return cls(
            keywords=[
                _Term(term, compile_term(term), weight, region) for term, region, weight in keywords
            ],
            blocked=[_Term(term, compile_term(term)) for term in blocked],
        )

    @classmethod
    def from_db(cls) -> "Curator":
        from .models import BlockedKeyword, Keyword

        return cls.from_terms(
            keywords=Keyword.objects.filter(is_active=True).values_list("term", "region", "weight"),
            blocked=BlockedKeyword.objects.filter(is_active=True).values_list("term", flat=True),
        )

    def blocked_terms(self, text: str) -> list[str]:
        return [t.term for t in self.blocked if t.pattern.search(text)]

    def _score(self, text: str) -> tuple[int, list[str], bool]:
        matched: list[str] = []
        score = 0
        has_idn = False
        for kw in self.keywords:
            if kw.pattern.search(text):
                matched.append(kw.term)
                score += kw.weight
                if kw.region in ("IDN", "BOTH"):
                    has_idn = True
        return score, matched, has_idn

    def evaluate(
        self,
        text: str,
        *,
        title: str | None = None,
        strict: bool = False,
        ignore=(),
        extra_block_text: str = "",
    ) -> FilterResult:
        """Scores ``text`` (or ``title`` + ``text``) against the Papua keywords.

        ``extra_block_text`` is only checked against the blocklist (e.g. the URL slug).
        ``ignore`` lists phrases that don't count as relevance, such as the outlet's own name.
        ``strict`` requires a Papua keyword in the title, or a summary that is clearly about
        Papua (score >= STRICT_BODY_SCORE), for outlets that also write about other topics.
        """
        full = f"{title or ''} {text}"
        blocked_by = self.blocked_terms(f"{full} {extra_block_text}")

        body = remove_phrases(text, ignore)
        heading = remove_phrases(title or "", ignore)
        score, matched, has_idn = self._score(f"{heading} {body}")
        if strict:
            title_score = self._score(heading)[0]
            relevant = title_score >= 1 or self._score(body)[0] >= STRICT_BODY_SCORE
        else:
            relevant = score >= 1

        if not relevant or blocked_by:
            return {
                "passes": False,
                "score": score,
                "matched_keywords": [],
                "region": None,
                "blocked_by": blocked_by,
            }

        return {
            "passes": True,
            "score": score,
            "matched_keywords": list(dict.fromkeys(matched)),
            "region": "IDN" if has_idn else "PNG",
            "blocked_by": [],
        }


def filter_by_papua_scope(text: str) -> FilterResult:
    """Convenience wrapper that loads terms from the database for a single check."""
    return Curator.from_db().evaluate(text)
