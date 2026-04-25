from django.db import models
from django.utils import timezone


class Source(models.Model):
    SOURCE_CHOICES = [
        ("bbc", "BBC News"),
        ("theconversation", "The Conversation"),
        ("jubi", "Jubi"),
        ("antara-papua", "Antara Papua"),
    ]

    id = models.CharField(max_length=50, primary_key=True, choices=SOURCE_CHOICES)
    name = models.CharField(max_length=100)
    homepage = models.URLField()
    feed_url = models.URLField()
    is_active = models.BooleanField(default=True)
    last_fetch_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Sumber"
        verbose_name_plural = "Sumber"

    def __str__(self):
        return self.name


class Story(models.Model):
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
    error = models.TextField(blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-fetched_at"]
        verbose_name = "Log Pengambilan"
        verbose_name_plural = "Log Pengambilan"

    def __str__(self):
        return f"{self.source_id} @ {self.fetched_at:%Y-%m-%d %H:%M}"
