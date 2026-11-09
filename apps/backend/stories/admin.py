from django import forms
from django.contrib import admin, messages
from django.db.models import Count, Q
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from curation.filter import Curator

from .models import FetchLog, Source, Story
from .services import PickError, build_pick, fetch_source, picks_source


class FetchLogInline(TabularInline):
    model = FetchLog
    fields = ["fetched_at", "story_count", "new_count", "rejected_count", "duration_ms", "error"]
    readonly_fields = fields
    extra = 0
    max_num = 10
    can_delete = False


@admin.register(Source)
class SourceAdmin(ModelAdmin):
    list_display = [
        "name",
        "display_id",
        "is_active",
        "last_fetch_at",
        "display_story_count",
        "display_error",
    ]
    list_filter = ["is_active"]
    search_fields = ["id", "name", "homepage", "feed_url"]
    readonly_fields = ["last_fetch_at", "last_error"]
    prepopulated_fields = {"id": ["name"]}
    inlines = [FetchLogInline]
    actions = ["fetch_now"]
    fieldsets = [
        (None, {"fields": ["name", "id", "is_active"]}),
        (
            "Feed",
            {
                "fields": [
                    "homepage",
                    "feed_url",
                    "papua_only",
                    "strict_relevance",
                    "allowed_domains",
                ]
            },
        ),
        ("Status", {"fields": ["last_fetch_at", "last_error"]}),
    ]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(active_story_count=Count("stories", filter=Q(stories__is_active=True)))
        )

    def get_readonly_fields(self, request, obj=None):
        # The id is the primary key (and part of the public API); editing it would create a copy.
        if obj is not None:
            return [*self.readonly_fields, "id"]
        return self.readonly_fields

    def get_prepopulated_fields(self, request, obj=None):
        return self.prepopulated_fields if obj is None else {}

    @display(description="ID")
    def display_id(self, obj):
        return obj.pk

    @display(description="Cerita", ordering="active_story_count")
    def display_story_count(self, obj):
        return obj.active_story_count

    @display(description="Error Terakhir", label={"": "success", "Ada error": "danger"})
    def display_error(self, obj):
        return "Ada error" if obj.last_error else ""

    @admin.action(description="Ambil cerita sekarang")
    def fetch_now(self, request, queryset):
        curator = Curator.from_db()
        for source in queryset:
            if source.is_manual:
                self.message_user(
                    request, f"{source.name}: sumber manual, tidak ada feed.", messages.INFO
                )
                continue
            result = fetch_source(source, curator)
            if result.error:
                self.message_user(request, f"{source.name}: {result.error}", messages.ERROR)
            else:
                self.message_user(
                    request,
                    f"{source.name}: {result.story_count} lolos filter, {result.new_count} baru, "
                    f"{result.rejected_count} ditolak.",
                    messages.SUCCESS,
                )


class AddStoryForm(forms.ModelForm):
    """Add a hand-picked article by URL; title, summary and thumbnail come from the page."""

    class Meta:
        model = Story
        fields = ["url", "kind", "venue", "title", "snippet", "image_url"]
        help_texts = {
            "kind": "Pilih Paper / jurnal untuk jurnal, laporan, atau buku: tidak perlu thumbnail.",
            "venue": "Opsional: nama jurnal atau penerbit (mis. IPAC, ANU Press).",
            "url": "Tempel tautan artikel. Judul, ringkasan, dan thumbnail diambil otomatis.",
            "title": "Opsional: isi untuk mengganti judul dari halaman.",
            "snippet": "Opsional: isi untuk mengganti ringkasan dari halaman.",
            "image_url": "Opsional: isi kalau halaman tidak punya gambar pratinjau (https).",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Everything but the URL is optional; the kind is detected from the page when left empty.
        for name in ("kind", "title", "snippet", "image_url", "venue"):
            self.fields[name].required = False

    def clean(self):
        data = super().clean()
        if not data.get("url"):
            return data
        try:
            fields = build_pick(
                data["url"],
                title=data.get("title", ""),
                snippet=data.get("snippet", ""),
                image_url=data.get("image_url", ""),
                kind=data.get("kind", ""),
                venue=data.get("venue", ""),
            )
        except PickError as exc:
            raise forms.ValidationError(str(exc)) from exc
        if Story.objects.filter(id=fields["id"]).exists():
            raise forms.ValidationError("Artikel ini sudah ada di Tabaca.")
        for name, value in fields.items():
            setattr(self.instance, name, value)
            if name in data:
                data[name] = value
        self.instance.source = picks_source()
        return data


@admin.register(Story)
class StoryAdmin(ModelAdmin):
    list_display = [
        "display_title",
        "source",
        "region",
        "published_at",
        "kind",
        "read_count",
        "is_active",
    ]
    list_filter = ["source", "kind", "region", "is_active"]
    search_fields = ["title", "snippet", "url", "author"]
    readonly_fields = ["id", "fetched_at", "matched_keywords", "read_count", "display_image"]
    ordering = ["-published_at"]
    date_hierarchy = "published_at"
    list_per_page = 50

    fieldsets = [
        (
            None,
            {"fields": ["id", "title", "display_image", "url", "source", "author", "is_active"]},
        ),
        ("Konten", {"fields": ["snippet", "image_url", "matched_keywords"]}),
        (
            "Metadata",
            {"fields": ["kind", "venue", "published_at", "fetched_at", "region", "read_count"]},
        ),
    ]

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = AddStoryForm
        return super().get_form(request, obj, **kwargs)

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return [
                (None, {"fields": ["url", "kind"]}),
                ("Opsional", {"fields": ["venue", "title", "snippet", "image_url"]}),
            ]
        return super().get_fieldsets(request, obj)

    def get_readonly_fields(self, request, obj=None):
        return [] if obj is None else super().get_readonly_fields(request, obj)

    @display(description="Judul")
    def display_title(self, obj):
        return obj.title[:80] + ("…" if len(obj.title) > 80 else "")

    @display(description="Gambar")
    def display_image(self, obj):
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height:120px;border-radius:6px;">', obj.image_url
            )
        return "—"


@admin.register(FetchLog)
class FetchLogAdmin(ModelAdmin):
    list_display = [
        "source",
        "fetched_at",
        "story_count",
        "new_count",
        "rejected_count",
        "display_duration",
        "display_has_error",
    ]
    list_filter = ["source"]
    readonly_fields = [
        "source",
        "fetched_at",
        "story_count",
        "new_count",
        "rejected_count",
        "duration_ms",
        "error",
    ]

    @display(description="Durasi")
    def display_duration(self, obj):
        if obj.duration_ms is None:
            return "—"
        return f"{obj.duration_ms} ms"

    @display(description="Error", boolean=True)
    def display_has_error(self, obj):
        return bool(obj.error)
