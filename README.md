# tabaca-backend

Backend API dan admin panel untuk [Tabaca](https://github.com/papuaopensource/tabaca) — ekstensi browser yang mengumpulkan cerita dari Papua, One Tab Away.

Dibangun dengan Django 5, Django REST Framework, dan Django Unfold.

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

## Memulai

```bash
# 1. Clone repo
git clone git@github.com:papuaopensource/tabaca-backend.git
cd tabaca-backend

# 2. Install dependencies
uv sync

# 3. Salin file env
cp .env.example .env
# Edit .env sesuai kebutuhan

# 4. Jalankan migrasi
uv run python manage.py migrate

# 5. Isi data awal (sumber & kata kunci Papua)
uv run python manage.py seed_sources
uv run python manage.py seed_keywords

# 6. Buat superuser untuk admin
uv run python manage.py createsuperuser

# 7. Ambil cerita pertama kali
uv run python manage.py fetch_stories

# 8. Jalankan server
uv run python manage.py runserver
```

Server berjalan di `http://localhost:8000`.

---

## API

Base URL: `/api/v1/`

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/v1/` | GET | API root (browsable) |
| `/api/v1/stories/` | GET | Daftar cerita |
| `/api/v1/stories/{id}/` | GET | Detail cerita |
| `/api/v1/sources/` | GET | Daftar sumber berita |
| `/api/v1/sources/{id}/` | GET | Detail sumber |
| `/api/v1/fetch-logs/` | GET | Riwayat pengambilan cerita |

### Filter & pencarian

```
GET /api/v1/stories/?source=jubi
GET /api/v1/stories/?region=IDN
GET /api/v1/stories/?search=Jayapura
GET /api/v1/stories/?ordering=-published_at
GET /api/v1/stories/?page=2
```

### Format respons

Output menggunakan camelCase agar konsisten dengan frontend TypeScript:

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/stories/?page=2",
  "previous": null,
  "results": [
    {
      "id": "a1b2c3d4e5f6a7b8",
      "title": "Konflik Papua: Situasi Terkini",
      "url": "https://jubi.id/...",
      "source": "jubi",
      "author": "Reporter Jubi",
      "publishedAt": "2025-04-25T08:00:00+09:00",
      "snippet": "...",
      "imageUrl": "https://...",
      "matchedKeywords": ["Papua", "Jayapura"],
      "fetchedAt": "2025-04-25T09:00:00+09:00",
      "region": "IDN"
    }
  ]
}
```

---

## Admin

Buka `http://localhost:8000/admin/` untuk mengakses panel admin dengan tampilan Django Unfold.

Fitur admin:
- **Cerita** — lihat, filter, cari, dan nonaktifkan cerita
- **Sumber** — kelola sumber RSS beserta log pengambilan terbaru
- **Log Pengambilan** — riwayat tiap fetch (jumlah cerita, error, durasi)
- **Kata Kunci** — tambah/edit/nonaktifkan kata kunci kurasi Papua langsung dari tabel

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

## Variabel environment

Salin `.env.example` ke `.env` dan sesuaikan:

```env
SECRET_KEY=django-insecure-ganti-di-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=
```

Untuk production, set `DEBUG=False` dan isi `SECRET_KEY` dengan nilai acak yang kuat.

---

## Sumber berita

| ID | Nama | Feed |
|---|---|---|
| `bbc` | BBC News | Asia RSS |
| `theconversation` | The Conversation | Asia-Pacific Atom |
| `jubi` | Jubi | RSS utama |
| `antara-papua` | Antara Papua | RSS terkini |

---

## Lisensi

MIT — lihat [LICENSE](../LICENSE).
