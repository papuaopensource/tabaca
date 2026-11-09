from pathlib import Path
from django.urls import reverse_lazy
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("SECRET_KEY", default="django-insecure-dev-key-change-in-production")
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_filters",
    "stories",
    "curation",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "django_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "django_project.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "id-ID"
TIME_ZONE = "Asia/Jayapura"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "stories.pagination.StandardPagination",
    "PAGE_SIZE": 20,
}

CORS_ALLOWED_ORIGINS = [o for o in config("CORS_ALLOWED_ORIGINS", default="", cast=Csv()) if o]

UNFOLD = {
    "SITE_TITLE": "Tabaca",
    "SITE_HEADER": "Tabaca",
    "SITE_URL": "/api/v1/",
    "SITE_SYMBOL": "newspaper",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "COLORS": {
        "font": {
            "subtle-light": "107 114 128",
            "subtle-dark": "156 163 175",
            "default-light": "75 85 99",
            "default-dark": "209 213 219",
            "important-light": "17 24 39",
            "important-dark": "243 244 246",
        },
        "primary": {
            "50": "254 243 238",
            "100": "253 227 215",
            "200": "251 199 178",
            "300": "248 163 132",
            "400": "243 119 83",
            "500": "200 75 30",
            "600": "168 56 21",
            "700": "135 44 17",
            "800": "104 34 13",
            "900": "78 26 10",
            "950": "45 15 6",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Konten",
                "separator": True,
                "items": [
                    {
                        "title": "Cerita",
                        "icon": "article",
                        "link": reverse_lazy("admin:stories_story_changelist"),
                    },
                    {
                        "title": "Sumber",
                        "icon": "rss_feed",
                        "link": reverse_lazy("admin:stories_source_changelist"),
                    },
                    {
                        "title": "Log Pengambilan",
                        "icon": "history",
                        "link": reverse_lazy("admin:stories_fetchlog_changelist"),
                    },
                ],
            },
            {
                "title": "Kurasi",
                "separator": True,
                "items": [
                    {
                        "title": "Kata Kunci",
                        "icon": "label",
                        "link": reverse_lazy("admin:curation_keyword_changelist"),
                    },
                ],
            },
            {
                "title": "Akun",
                "separator": True,
                "items": [
                    {
                        "title": "Pengguna",
                        "icon": "person",
                        "link": reverse_lazy("admin:auth_user_changelist"),
                    },
                    {
                        "title": "Grup",
                        "icon": "group",
                        "link": reverse_lazy("admin:auth_group_changelist"),
                    },
                ],
            },
        ],
    },
}
