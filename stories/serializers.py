from rest_framework import serializers
from .models import Story, Source, FetchLog


class SourceSerializer(serializers.ModelSerializer):
    story_count = serializers.SerializerMethodField()

    class Meta:
        model = Source
        fields = ["id", "name", "homepage", "feed_url", "is_active", "last_fetch_at", "last_error", "story_count"]

    def get_story_count(self, obj):
        return obj.stories.filter(is_active=True).count()


class StorySerializer(serializers.ModelSerializer):
    source = serializers.CharField(source="source_id")

    class Meta:
        model = Story
        fields = [
            "id", "title", "url", "source", "author",
            "published_at", "snippet", "image_url",
            "matched_keywords", "fetched_at", "region",
        ]


class FetchLogSerializer(serializers.ModelSerializer):
    source = serializers.CharField(source="source_id")

    class Meta:
        model = FetchLog
        fields = ["id", "source", "fetched_at", "story_count", "new_count", "error", "duration_ms"]
