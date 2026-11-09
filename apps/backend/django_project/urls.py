from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("site-manager/", admin.site.urls),
    path("api/v1/", include("stories.urls")),
]
