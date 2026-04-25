from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display
from .models import Story, Source, FetchLog


class FetchLogInline(TabularInline):
    model = FetchLog
    fields = ["fetched_at", "story_count", "new_count", "duration_ms", "error"]
    readonly_fields = ["fetched_at", "story_count", "new_count", "duration_ms", "error"]
    extra = 0
    max_num = 10
    can_delete = False


@admin.register(Source)
class SourceAdmin(ModelAdmin):
    list_display = ["name", "display_id", "is_active", "last_fetch_at", "display_story_count", "display_error"]
    list_filter = ["is_active"]
    readonly_fields = ["last_fetch_at", "last_error"]
    inlines = [FetchLogInline]

    @display(description="ID")
    def display_id(self, obj):
        return obj.pk

    @display(description="Cerita", ordering="stories__count")
    def display_story_count(self, obj):
        return obj.stories.filter(is_active=True).count()

    @display(description="Error Terakhir", label={"": "success", "Ada error": "danger"})
    def display_error(self, obj):
        if obj.last_error:
            return "Ada error"
        return ""


@admin.register(Story)
class StoryAdmin(ModelAdmin):
    list_display = ["display_title", "source", "region", "published_at", "fetched_at", "is_active"]
    list_filter = ["source", "region", "is_active"]
    search_fields = ["title", "snippet", "url", "author"]
    readonly_fields = ["id", "fetched_at", "matched_keywords", "display_image"]
    ordering = ["-published_at"]
    date_hierarchy = "published_at"
    list_per_page = 50

    fieldsets = [
        (None, {
            "fields": ["id", "title", "display_image", "url", "source", "author", "is_active"],
        }),
        ("Konten", {
            "fields": ["snippet", "image_url", "matched_keywords"],
        }),
        ("Metadata", {
            "fields": ["published_at", "fetched_at", "region"],
        }),
    ]

    @display(description="Judul")
    def display_title(self, obj):
        return obj.title[:80] + ("…" if len(obj.title) > 80 else "")

    @display(description="Gambar")
    def display_image(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" style="max-height:120px;border-radius:6px;">', obj.image_url)
        return "—"


@admin.register(FetchLog)
class FetchLogAdmin(ModelAdmin):
    list_display = ["source", "fetched_at", "story_count", "new_count", "display_duration", "display_has_error"]
    list_filter = ["source"]
    readonly_fields = ["source", "fetched_at", "story_count", "new_count", "duration_ms", "error"]

    @display(description="Durasi")
    def display_duration(self, obj):
        if obj.duration_ms is None:
            return "—"
        return f"{obj.duration_ms} ms"

    @display(description="Error", boolean=True)
    def display_has_error(self, obj):
        return bool(obj.error)
