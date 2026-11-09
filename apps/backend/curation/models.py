from django.db import models


class Keyword(models.Model):
    REGION_CHOICES = [
        ("IDN", "Indonesia"),
        ("PNG", "Papua New Guinea"),
        ("BOTH", "Keduanya"),
    ]

    term = models.CharField(max_length=100, unique=True)
    region = models.CharField(max_length=4, choices=REGION_CHOICES, default="IDN")
    weight = models.IntegerField(default=1, help_text="Bobot relevansi (1 = rendah, 2 = tinggi)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["term"]
        verbose_name = "Kata Kunci"
        verbose_name_plural = "Kata Kunci"

    def __str__(self):
        return f"{self.term} ({self.region}, w{self.weight})"


class BlockedKeyword(models.Model):
    """Terms that make a story unsafe to show, regardless of Papua relevance."""

    CATEGORY_CHOICES = [
        ("gambling", "Judi"),
        ("adult", "Konten dewasa"),
        ("graphic", "Konten grafis"),
        ("spam", "Spam / promosi"),
        ("other", "Lainnya"),
    ]

    term = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "term"]
        verbose_name = "Kata Terlarang"
        verbose_name_plural = "Kata Terlarang"

    def __str__(self):
        return f"{self.term} ({self.get_category_display()})"
