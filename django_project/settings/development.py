from .base import BASE_DIR
from .base import *  # noqa: F401, F403

DEBUG = True

CORS_ALLOW_ALL_ORIGINS = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
