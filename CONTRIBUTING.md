# Panduan Berkontribusi

Terima kasih sudah tertarik berkontribusi pada tabaca-backend! Dokumen ini menjelaskan cara setup lingkungan pengembangan dan alur kerja kontribusi.

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

# Jalankan server
uv run python manage.py runserver
```

---

## Struktur project

```
tabaca-backend/
├── django_project/         # Konfigurasi Django (settings, urls, wsgi)
├── stories/                # App utama
│   ├── models.py           # Source, Story, FetchLog
│   ├── admin.py            # Unfold admin
│   ├── serializers.py      # DRF serializers (camelCase output)
│   ├── views.py            # ViewSets
│   ├── urls.py             # Router
│   ├── adapters/           # RSS adapter per sumber
│   │   ├── base.py         # Utilitas bersama (hash, html_to_text, dst)
│   │   ├── bbc.py
│   │   ├── theconversation.py
│   │   ├── jubi.py
│   │   └── antara_papua.py
│   └── management/commands/
│       ├── fetch_stories.py
│       └── seed_sources.py
└── curation/               # Kurasi konten Papua
    ├── models.py           # Keyword
    ├── filter.py           # Logika filter kata kunci
    ├── admin.py
    └── management/commands/
        └── seed_keywords.py
```

---

## Alur kerja kontribusi

1. **Buat issue terlebih dahulu** untuk fitur baru atau bug yang ditemukan
2. **Fork** repo dan buat branch dari `main`:
   ```bash
   git checkout -b feat/nama-fitur
   # atau
   git checkout -b fix/nama-bug
   ```
3. **Tulis kode** — ikuti konvensi yang ada (lihat bagian di bawah)
4. **Jalankan linter** sebelum commit:
   ```bash
   uv run ruff check .
   uv run ruff format .
   ```
5. **Jalankan tests** jika ada:
   ```bash
   uv run pytest
   ```
6. **Commit** dengan pesan yang deskriptif:
   ```bash
   git commit -m "feat: tambah adapter untuk sumber X"
   ```
7. **Push** dan buat Pull Request ke `main`

---

## Konvensi kode

### Python / Django

- Gunakan **ruff** untuk linting dan formatting (`uv run ruff check . && uv run ruff format .`)
- Nama variabel dan fungsi: `snake_case`
- Nama kelas: `PascalCase`
- Panjang baris maksimal: 100 karakter
- Hindari komentar yang hanya mendeskripsikan *apa* — tulis komentar hanya untuk menjelaskan *kenapa*

### Model

- Selalu tambahkan `verbose_name` dan `verbose_name_plural` dalam Bahasa Indonesia
- Gunakan `get_or_create` / `update_or_create` untuk upsert story agar idempoten

### API

- Output API selalu camelCase (ditangani otomatis oleh `djangorestframework-camel-case`)
- Endpoint baru selalu di bawah `/api/v1/`
- ViewSet sebaiknya `ReadOnlyModelViewSet` kecuali ada alasan kuat untuk write access

### Admin (Unfold)

- Gunakan `@display` decorator dari `unfold.decorators` untuk kolom kustom
- Tambahkan `list_per_page` yang wajar (50–100) untuk tabel besar

---

## Menambah sumber berita baru

1. Buat adapter baru di [stories/adapters/](stories/adapters/):
   ```python
   # stories/adapters/nama_sumber.py
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

2. Daftarkan di [stories/adapters/\_\_init\_\_.py](stories/adapters/__init__.py):
   ```python
   from .nama_sumber import NamaSumberAdapter
   _REGISTRY["nama-sumber"] = NamaSumberAdapter
   ```

3. Tambahkan ke `SOURCES` di [stories/management/commands/seed_sources.py](stories/management/commands/seed_sources.py)

4. Tambahkan ke `SOURCE_CHOICES` di [stories/models.py](stories/models.py)

---

## Menambah kata kunci kurasi

Kata kunci bisa ditambah langsung dari admin panel (menu **Kata Kunci**), atau melalui migrasi data jika ingin permanen:

```bash
# Edit KEYWORDS di curation/management/commands/seed_keywords.py
# lalu jalankan ulang dengan --clear jika perlu reset
uv run python manage.py seed_keywords
```

---

## Pertanyaan?

Buka [issue](https://github.com/papuaopensource/tabaca-backend/issues) atau diskusi di repo utama [tabaca](https://github.com/papuaopensource/tabaca).
