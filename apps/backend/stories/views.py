from django.db.models import F, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import FetchLog, Source, Story
from .serializers import FetchLogSerializer, SourceSerializer, StorySerializer


class StoryViewSet(viewsets.ReadOnlyModelViewSet):
    # Deactivating a source in the admin hides its stories immediately. Every article shown in
    # the extension has a thumbnail; papers get a generated cover instead.
    queryset = (
        Story.objects.filter(is_active=True, source__is_active=True)
        .exclude(Q(image_url="") & ~Q(kind="paper"))
        .select_related("source")
        .order_by("-published_at")
    )
    serializer_class = StorySerializer
    filterset_fields = ["source", "region", "kind"]
    search_fields = ["title", "snippet"]
    ordering_fields = ["published_at", "fetched_at", "read_count"]
    ordering = ["-published_at"]
    # Only used by actions that opt into ScopedRateThrottle (the read counter).
    throttle_scope = "story-read"

    @action(
        detail=True,
        methods=["post"],
        authentication_classes=[],
        permission_classes=[AllowAny],
        throttle_classes=[ScopedRateThrottle],
    )
    def read(self, request, pk=None):
        """Anonymous "opened from Tabaca" counter shown as the story's stats.

        No user data is stored; the extension only reports a story once per browser and the
        endpoint is rate limited per IP.
        """
        story = self.get_object()
        Story.objects.filter(pk=story.pk).update(read_count=F("read_count") + 1)
        story.refresh_from_db(fields=["read_count"])
        return Response({"read_count": story.read_count})


class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Source.objects.filter(is_active=True)
    serializer_class = SourceSerializer


class FetchLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FetchLog.objects.select_related("source").order_by("-fetched_at")
    serializer_class = FetchLogSerializer
    filterset_fields = ["source"]
