from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("site-manager/", admin.site.urls),
    path("api/v1/", include("stories.urls")),
]
