# Development Guide

Panduan teknis untuk menjalankan dan mengembangkan tabaca-backend secara lokal.

---

## Stack

| Komponen | Teknologi |
|---|---|
| Framework | Django 5.2 |
| API | Django REST Framework 3.15 |
| Admin | Django Unfold |
| Dependency manager | [uv](https://docs.astral.sh/uv/) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Env config | python-decouple |

---

## Prasyarat

- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)

---

## Setup

```bash
git clone git@github.com:papuaopensource/tabaca-backend.git
cd tabaca-backend

uv sync
cp .env.example .env

uv run python manage.py migrate
uv run python manage.py seed_sources
uv run python manage.py seed_keywords
uv run python manage.py createsuperuser
uv run python manage.py fetch_stories
uv run python manage.py runserver
```

Server berjalan di `http://localhost:8000`.  
Admin panel: `http://localhost:8000/site-manager/`

---

## Settings

Settings dibagi di `django_project/settings/`:

| File | Digunakan untuk |
|---|---|
| `base.py` | Konfigurasi bersama semua environment |
| `development.py` | Lokal — SQLite, CORS terbuka, DEBUG aktif |
| `production.py` | Server — PostgreSQL, HTTPS, DEBUG mati |

`manage.py` dan `pytest` default ke `development`. `wsgi.py` / `asgi.py` default ke `production`.

Untuk override eksplisit:

```bash
DJANGO_SETTINGS_MODULE=django_project.settings.production uv run python manage.py check
```

---

## Variabel environment

```env
# .env
SECRET_KEY=django-insecure-ganti-di-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=

# Production only
# DB_NAME=tabaca
# DB_USER=tabaca
# DB_PASSWORD=
# DB_HOST=localhost
# DB_PORT=5432
```

---

## API

Base URL: `/api/v1/`

| Endpoint | Deskripsi |
|---|---|
| `GET /api/v1/stories/` | Daftar cerita |
| `GET /api/v1/stories/{id}/` | Detail cerita |
| `GET /api/v1/sources/` | Daftar sumber |
| `GET /api/v1/fetch-logs/` | Riwayat pengambilan |

Filter yang tersedia:

```
?source=jubi
?region=IDN
?search=Jayapura
?ordering=-published_at
?page=2
```

Output camelCase (konsisten dengan frontend TypeScript):

```json
{
  "id": "a1b2c3d4",
  "title": "...",
  "source": "jubi",
  "publishedAt": "2025-04-25T08:00:00+09:00",
  "matchedKeywords": ["Papua", "Jayapura"],
  "region": "IDN"
}
```

---

## Perintah manajemen

```bash
# Ambil semua sumber aktif
uv run python manage.py fetch_stories

# Ambil satu sumber saja
uv run python manage.py fetch_stories --source jubi

# Isi ulang kata kunci (--clear untuk reset total)
uv run python manage.py seed_keywords --clear

# Isi ulang sumber
uv run python manage.py seed_sources
```

---

## Linter & tests

```bash
uv run ruff check .
uv run ruff format .
uv run pytest
```

---

## Struktur project

```
tabaca-backend/
├── django_project/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── stories/
│   ├── models.py            # Source, Story, FetchLog
│   ├── admin.py
│   ├── serializers.py
│   ├── views.py
│   ├── adapters/            # RSS adapter per sumber
│   │   ├── base.py
│   │   ├── bbc.py
│   │   ├── theconversation.py
│   │   ├── jubi.py
│   │   └── antara_papua.py
│   └── management/commands/
│       ├── fetch_stories.py
│       └── seed_sources.py
└── curation/
    ├── models.py            # Keyword
    ├── filter.py            # Filter kata kunci
    ├── admin.py
    └── management/commands/
        └── seed_keywords.py
```
