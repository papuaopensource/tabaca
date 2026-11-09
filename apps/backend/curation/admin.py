from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Keyword


@admin.register(Keyword)
class KeywordAdmin(ModelAdmin):
    list_display = ["term", "region", "weight", "is_active", "created_at"]
    list_filter = ["region", "is_active", "weight"]
    search_fields = ["term"]
    list_editable = ["is_active", "weight"]
    list_per_page = 100
