from rest_framework import viewsets
from .models import Story, Source, FetchLog
from .serializers import StorySerializer, SourceSerializer, FetchLogSerializer


class StoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Story.objects.filter(is_active=True).select_related("source").order_by("-published_at")
    serializer_class = StorySerializer
    filterset_fields = ["source", "region"]
    search_fields = ["title", "snippet"]
    ordering_fields = ["published_at", "fetched_at"]
    ordering = ["-published_at"]


class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Source.objects.filter(is_active=True)
    serializer_class = SourceSerializer


class FetchLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FetchLog.objects.select_related("source").order_by("-fetched_at")
    serializer_class = FetchLogSerializer
    filterset_fields = ["source"]
