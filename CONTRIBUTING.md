# Panduan Berkontribusi

Terima kasih sudah tertarik berkontribusi pada tabaca-backend!

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

## Setup lingkungan dev

### Prasyarat

- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Git

### Langkah setup

```bash
# Fork repo di GitHub, lalu clone fork kamu
git clone git@github.com:<username>/tabaca-backend.git
cd tabaca-backend

# Install semua dependencies termasuk dev tools
uv sync

# Salin dan konfigurasi env
cp .env.example .env

# Setup database
uv run python manage.py migrate
uv run python manage.py seed_sources
uv run python manage.py seed_keywords
uv run python manage.py createsuperuser

# Ambil cerita pertama kali
uv run python manage.py fetch_stories

# Jalankan server
uv run python manage.py runserver
```

Server berjalan di `http://localhost:8000`.

---

## Settings

Settings dibagi menjadi tiga file di `django_project/settings/`:

| File | Digunakan untuk |
|---|---|
| `base.py` | Konfigurasi bersama semua environment |
| `development.py` | Lokal dev — SQLite, CORS terbuka, DEBUG aktif |
| `production.py` | Server — PostgreSQL, HTTPS, DEBUG mati |

`manage.py` dan `pytest` secara default menggunakan `development`. `wsgi.py` / `asgi.py` menggunakan `production`. Untuk mengganti secara eksplisit:

```bash
DJANGO_SETTINGS_MODULE=django_project.settings.production uv run python manage.py check
```

---

## Variabel environment

Salin `.env.example` ke `.env`:

```env
SECRET_KEY=django-insecure-ganti-di-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=
```

Untuk production, tambahkan juga variabel database:

```env
DB_NAME=tabaca
DB_USER=tabaca
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432
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

Output selalu camelCase agar konsisten dengan frontend TypeScript:

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

## Admin

Buka `http://localhost:8000/site-manager/` untuk panel admin (Django Unfold).

---

## Perintah manajemen

```bash
# Ambil semua sumber aktif
uv run python manage.py fetch_stories

# Ambil satu sumber saja
uv run python manage.py fetch_stories --source jubi

# Reset dan isi ulang kata kunci
uv run python manage.py seed_keywords --clear

# Isi ulang sumber
uv run python manage.py seed_sources
```

---

## Struktur project

```
tabaca-backend/
├── django_project/
│   ├── settings/
│   │   ├── base.py          # Konfigurasi bersama
│   │   ├── development.py   # Dev: SQLite, CORS terbuka
│   │   └── production.py    # Prod: PostgreSQL, HTTPS
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── stories/
│   ├── models.py            # Source, Story, FetchLog
│   ├── admin.py             # Unfold admin
│   ├── serializers.py       # camelCase output
│   ├── views.py
│   ├── adapters/            # RSS adapter per sumber
│   │   ├── base.py          # Utilitas: hash, html_to_text, dst
│   │   ├── bbc.py
│   │   ├── theconversation.py
│   │   ├── jubi.py
│   │   └── antara_papua.py
│   └── management/commands/
│       ├── fetch_stories.py
│       └── seed_sources.py
└── curation/
    ├── models.py            # Keyword
    ├── filter.py            # Filter kata kunci (word-boundary regex)
    ├── admin.py
    └── management/commands/
        └── seed_keywords.py
```

---

## Alur kerja kontribusi

1. Buat issue untuk fitur baru atau bug yang ditemukan
2. Fork repo dan buat branch dari `main`:
   ```bash
   git checkout -b feat/nama-fitur
   ```
3. Tulis kode, ikuti konvensi di bawah
4. Jalankan linter sebelum commit:
   ```bash
   uv run ruff check . && uv run ruff format .
   ```
5. Jalankan tests:
   ```bash
   uv run pytest
   ```
6. Buat Pull Request ke `main`

---

## Konvensi kode

- Linter & formatter: **ruff** (line length 100)
- Nama variabel/fungsi: `snake_case`, kelas: `PascalCase`
- `verbose_name` model selalu dalam Bahasa Indonesia
- Endpoint baru selalu di bawah `/api/v1/`
- Gunakan `get_or_create` / `update_or_create` untuk upsert agar idempoten
- Tulis komentar hanya untuk menjelaskan *kenapa*, bukan *apa*

---

## Menambah sumber berita baru

1. Buat adapter di `stories/adapters/nama_sumber.py`:
   ```python
   from .base import BaseAdapter, hash_url, html_to_text, truncate, parse_date

   class NamaSumberAdapter(BaseAdapter):
       source_id = "nama-sumber"
       name = "Nama Sumber"
       homepage = "https://..."
       feed_url = "https://.../feed"

       def normalize(self, entry) -> dict:
           return {
               "id": hash_url(entry.link),
               "title": html_to_text(entry.get("title", "")),
               "url": entry.link,
               "source_id": self.source_id,
               "author": entry.get("author", ""),
               "published_at": parse_date(entry.get("published", "")),
               "snippet": truncate(html_to_text(entry.get("summary", "")), 200),
               "image_url": self._get_image(entry),
           }
   ```

2. Daftarkan di `stories/adapters/__init__.py`

3. Tambahkan ke `SOURCES` di `stories/management/commands/seed_sources.py`

4. Tambahkan ke `SOURCE_CHOICES` di `stories/models.py`

---

## Pertanyaan?

Buka [issue](https://github.com/papuaopensource/tabaca-backend/issues) atau diskusi di repo utama [tabaca](https://github.com/papuaopensource/tabaca).
