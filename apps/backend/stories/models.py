from urllib.parse import urlsplit

from django.core.exceptions import ValidationError
from django.core.validators import validate_slug
from django.db import models
from django.utils import timezone

from .safety import normalize_domain


def validate_domain_list(value: str):
    for domain in split_domains(value):
        if "." not in domain or "/" in domain or ":" in domain:
            raise ValidationError(f"Domain tidak valid: {domain}")


def split_domains(value: str) -> list[str]:
    return [normalize_domain(d) for d in value.replace("\n", ",").split(",") if d.strip()]


class Source(models.Model):
    """A news feed the admins follow. Stories are fetched from it and curated automatically."""

    id = models.CharField(
        max_length=50,
        primary_key=True,
        validators=[validate_slug],
        help_text="ID unik huruf kecil, mis. suara-papua. Tidak bisa diubah setelah disimpan.",
    )
    name = models.CharField(max_length=100)
    homepage = models.URLField()
    feed_url = models.URLField(
        blank=True,
        help_text=(
            "URL feed RSS/Atom atau WordPress REST API. Kosongkan untuk sumber manual "
            "(artikel pilihan yang ditambahkan satu per satu)."
        ),
    )
    strict_relevance = models.BooleanField(
        "Relevansi ketat",
        default=False,
        help_text=(
            "Untuk media yang juga menulis topik umum: tulisan harus menyebut Papua di judul, "
            "atau ringkasannya jelas tentang Papua (bukan sekadar menyebut sekali)."
        ),
    )
    papua_only = models.BooleanField(
        "Feed khusus Papua",
        default=False,
        help_text=(
            "Semua tulisan di feed ini sudah tentang Papua (mis. kategori atau topik Papua), "
            "jadi filter kata kunci dilewati. Pemeriksaan keamanan dan thumbnail tetap berlaku."
        ),
    )
    allowed_domains = models.TextField(
        blank=True,
        validators=[validate_domain_list],
        help_text=(
            "Domain tautan artikel yang diizinkan, pisahkan dengan koma (mis. bbc.com, bbc.co.uk). "
            "Subdomain ikut diizinkan. Kosongkan untuk memakai domain homepage."
        ),
    )
    is_active = models.BooleanField(default=True)
    last_fetch_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Sumber"
        verbose_name_plural = "Sumber"

    def __str__(self):
        return self.name

    @property
    def is_manual(self) -> bool:
        """Manual sources hold hand-picked articles from any site instead of fetching a feed."""
        return not self.feed_url

    def get_allowed_domains(self) -> list[str]:
        domains = split_domains(self.allowed_domains)
        if not domains:
            host = urlsplit(self.homepage).hostname or ""
            domains = [normalize_domain(host)] if host else []
        return domains


class Story(models.Model):
    KIND_CHOICES = [
        ("article", "Artikel"),
        ("paper", "Paper / jurnal"),
    ]
    REGION_CHOICES = [
        ("IDN", "Indonesia"),
        ("PNG", "Papua New Guinea"),
    ]

    id = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=2000, unique=True)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name="stories")
    author = models.CharField(max_length=200, blank=True)
    published_at = models.DateTimeField()
    snippet = models.TextField()
    image_url = models.URLField(max_length=2000, blank=True)
    matched_keywords = models.JSONField(default=list)
    fetched_at = models.DateTimeField(default=timezone.now)
    region = models.CharField(max_length=3, choices=REGION_CHOICES, blank=True)
    is_active = models.BooleanField(default=True)
    read_count = models.PositiveIntegerField(
        default=0, help_text="Berapa kali cerita dibuka lewat ekstensi (anonim)."
    )
    kind = models.CharField(
        max_length=10,
        choices=KIND_CHOICES,
        default="article",
        help_text="Paper jurnal tidak wajib punya thumbnail; ekstensi menampilkan sampulnya.",
    )
    venue = models.CharField(
        max_length=200, blank=True, help_text="Nama jurnal atau penerbit (untuk paper)."
    )

    class Meta:
        ordering = ["-published_at"]
        verbose_name = "Cerita"
        verbose_name_plural = "Cerita"
        indexes = [
            models.Index(fields=["-published_at"]),
            models.Index(fields=["source", "-published_at"]),
            models.Index(fields=["region"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.title


class FetchLog(models.Model):
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name="fetch_logs")
    fetched_at = models.DateTimeField(auto_now_add=True)
    story_count = models.IntegerField(default=0)
    new_count = models.IntegerField(default=0)
    rejected_count = models.IntegerField(
        default=0, help_text="Entri yang ditolak karena tautan tidak aman atau kata terlarang."
    )
    error = models.TextField(blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-fetched_at"]
        verbose_name = "Log Pengambilan"
        verbose_name_plural = "Log Pengambilan"

    def __str__(self):
        return f"{self.source_id} @ {self.fetched_at:%Y-%m-%d %H:%M}"
