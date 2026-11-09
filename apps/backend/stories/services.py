import time
from collections.abc import Callable
from dataclasses import dataclass
from urllib.parse import urlsplit

from django.db import IntegrityError
from django.utils import timezone

from curation.filter import Curator

from .feeds import (
    clean_summary,
    fetch_entries,
    hash_url,
    normalize_entry,
    strip_tracking,
    truncate,
    url_words,
)
from .models import FetchLog, Source, Story
from .pages import PageMeta, fetch_page_meta
from .safety import is_safe_link, normalize_domain, safe_image_url

MAX_URL_LENGTH = 2000

# Hand-picked articles from any site live under this manual source (no feed).
PICKS_SOURCE_ID = "pilihan"
PICKS_SOURCE_DEFAULTS = {
    "name": "Pilihan Tabaca",
    "homepage": "https://github.com/papuaopensource/tabaca",
    "feed_url": "",
}


@dataclass
class FetchResult:
    source: Source
    story_count: int = 0
    new_count: int = 0
    rejected_count: int = 0
    error: str = ""


@dataclass
class RecheckResult:
    deactivated: int = 0


class PickError(Exception):
    """A hand-picked article can't be added; the message is shown to the admin."""


def _own_domain(url: str) -> list[str]:
    host = urlsplit(url).hostname or ""
    return [normalize_domain(host)] if host else []


def _image_from_page(url: str, fetch_meta: Callable[[str], PageMeta]) -> str:
    try:
        return safe_image_url(fetch_meta(url).image)
    except Exception:
        return ""


def fetch_source(
    source: Source,
    curator: Curator | None = None,
    fetch: Callable[[str], list] = fetch_entries,
    fetch_meta: Callable[[str], PageMeta] = fetch_page_meta,
) -> FetchResult:
    """Fetches one source's feed and stores entries that are about Papua, safe, and have a
    thumbnail. Feeds without images fall back to the article page's preview image."""
    result = FetchResult(source=source)
    if source.is_manual:
        return result

    curator = curator or Curator.from_db()
    allowed_domains = source.get_allowed_domains()
    # The outlet's own name ("Lao-Lao Papua", "suarapapua.com") is not a sign of relevance.
    own_names = [source.name, source.name.split(" — ")[0], *allowed_domains]
    start = time.monotonic()

    try:
        for entry in fetch(source.feed_url):
            try:
                raw = normalize_entry(entry)
            except Exception:
                continue
            if not raw["title"]:
                continue

            url = raw["url"]
            if len(url) > MAX_URL_LENGTH or not is_safe_link(url, allowed_domains):
                result.rejected_count += 1
                continue

            verdict = curator.evaluate(
                raw["snippet"],
                title=raw["title"],
                strict=source.strict_relevance,
                ignore=own_names,
                extra_block_text=url_words(url),
            )
            if verdict["blocked_by"]:
                result.rejected_count += 1
                continue
            if not verdict["passes"] and not source.papua_only:
                continue

            existing = Story.objects.filter(id=raw["id"]).only("id", "image_url").first()
            if existing:
                result.story_count += 1
                # Repair a missing or unusable thumbnail once (e.g. after switching a source from
                # RSS to the WordPress API, or a tracking pixel picked up by an older version).
                if raw["kind"] != "paper" and not safe_image_url(existing.image_url):
                    image = safe_image_url(raw["image_url"]) or _image_from_page(url, fetch_meta)
                    if image and len(image) <= MAX_URL_LENGTH:
                        Story.objects.filter(id=existing.id).update(image_url=image)
                continue

            # Every article needs a thumbnail; papers get a generated cover in the extension.
            is_paper = raw["kind"] == "paper"
            image_url = safe_image_url(raw["image_url"])
            if not image_url and not is_paper:
                image_url = _image_from_page(url, fetch_meta)
            if len(image_url) > MAX_URL_LENGTH:
                image_url = ""
            if not image_url and not is_paper:
                continue

            result.story_count += 1
            try:
                Story.objects.create(
                    **{
                        **raw,
                        "source": source,
                        "image_url": image_url,
                        "matched_keywords": verdict["matched_keywords"],
                        "region": verdict["region"] or ("IDN" if source.papua_only else ""),
                        "fetched_at": timezone.now(),
                    }
                )
            except IntegrityError:
                continue
            result.new_count += 1

        source.last_fetch_at = timezone.now()
        source.last_error = ""
        source.save(update_fields=["last_fetch_at", "last_error"])
    except Exception as exc:
        result.error = str(exc) or exc.__class__.__name__
        source.last_error = result.error
        source.save(update_fields=["last_error"])

    FetchLog.objects.create(
        source=source,
        story_count=result.story_count,
        new_count=result.new_count,
        rejected_count=result.rejected_count,
        error=result.error,
        duration_ms=int((time.monotonic() - start) * 1000),
    )
    return result


def picks_source() -> Source:
    source, _ = Source.objects.get_or_create(id=PICKS_SOURCE_ID, defaults=PICKS_SOURCE_DEFAULTS)
    return source


def build_pick(
    url: str,
    *,
    title: str = "",
    snippet: str = "",
    image_url: str = "",
    kind: str = "",
    venue: str = "",
    curator: Curator | None = None,
    fetch_meta: Callable[[str], PageMeta] = fetch_page_meta,
) -> dict:
    """Prepares the fields of a hand-picked article from its page's preview metadata.

    Admins pick these, so there is no Papua keyword requirement; the blocklist, link and
    thumbnail rules still apply. Explicit title/snippet/image values override the page's.
    Papers and other publications (scholarly pages, or `kind="paper"`) need no thumbnail.
    """
    url = strip_tracking(url.strip())
    if len(url) > MAX_URL_LENGTH or not is_safe_link(url, _own_domain(url)):
        raise PickError("URL harus berupa tautan http(s) ke sebuah artikel.")

    try:
        meta = fetch_meta(url)
    except Exception as exc:
        if not (title and image_url):
            raise PickError(
                f"Tidak bisa membuka halaman ({exc}). Isi judul dan URL gambar secara manual."
            ) from exc
        meta = PageMeta()

    title = (title or meta.title).strip()[:500]
    if not title:
        raise PickError("Halaman tidak punya judul. Isi judul secara manual.")
    is_paper = meta.is_paper or kind == "paper"
    image = safe_image_url(image_url or meta.image)
    if len(image) > MAX_URL_LENGTH:
        image = ""
    if not image and not is_paper:
        raise PickError(
            "Thumbnail wajib, tapi halaman ini tidak punya gambar pratinjau https (og:image). "
            "Isi URL gambar secara manual."
        )
    snippet = truncate(clean_summary(snippet or meta.description))

    curator = curator or Curator.from_db()
    verdict = curator.evaluate(f"{title} {snippet}", extra_block_text=url_words(url))
    if verdict["blocked_by"]:
        raise PickError(f"Mengandung kata terlarang: {', '.join(verdict['blocked_by'])}.")

    return {
        "id": hash_url(url),
        "url": url,
        "title": title,
        "snippet": snippet,
        "image_url": image,
        "author": meta.author,
        "published_at": meta.published_at or timezone.now(),
        "matched_keywords": verdict["matched_keywords"],
        "region": verdict["region"] or "IDN",
        "fetched_at": timezone.now(),
        "kind": "paper" if is_paper else "article",
        "venue": (venue or meta.venue).strip()[:200],
    }


def add_pick(url: str, **kwargs) -> tuple[Story, bool]:
    """Adds a hand-picked article (see `build_pick`). Returns (story, created)."""
    fields = build_pick(url, **kwargs)
    existing = Story.objects.filter(id=fields["id"]).first()
    if existing:
        return existing, False
    return Story.objects.create(**fields, source=picks_source()), True


def recheck_stories(curator: Curator | None = None) -> RecheckResult:
    """Re-applies the blocklist, link and thumbnail rules to stories already stored.

    Runs after every fetch so a term added to the blocklist (or a tightened domain list) also
    hides older stories. Stories are only ever deactivated here, never re-activated, so manual
    moderation in the admin is respected.
    """
    curator = curator or Curator.from_db()
    result = RecheckResult()
    domains_by_source: dict[str, list[str]] = {}
    unsafe_ids: list[str] = []

    stories = Story.objects.filter(is_active=True).select_related("source")
    for story in stories.iterator(chunk_size=500):
        if story.source.is_manual:
            # Hand-picked articles can come from any site.
            allowed = _own_domain(story.url)
        else:
            if story.source_id not in domains_by_source:
                domains_by_source[story.source_id] = story.source.get_allowed_domains()
            allowed = domains_by_source[story.source_id]

        text = f"{story.title} {story.snippet} {url_words(story.url)}"
        needs_thumbnail = story.kind != "paper"
        if (
            not is_safe_link(story.url, allowed)
            or curator.blocked_terms(text)
            or (needs_thumbnail and not safe_image_url(story.image_url))
        ):
            unsafe_ids.append(story.id)

    if unsafe_ids:
        result.deactivated = Story.objects.filter(id__in=unsafe_ids).update(is_active=False)
    return result
