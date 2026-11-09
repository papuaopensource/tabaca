from rest_framework.routers import DefaultRouter

from .views import FetchLogViewSet, SourceViewSet, StoryViewSet

router = DefaultRouter()
router.register("stories", StoryViewSet, basename="story")
router.register("sources", SourceViewSet, basename="source")
router.register("fetch-logs", FetchLogViewSet, basename="fetchlog")

urlpatterns = router.urls
