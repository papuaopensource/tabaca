# Panduan Berkontribusi

Terima kasih sudah tertarik berkontribusi pada tabaca-backend! Untuk setup lingkungan dev, lihat [DEVELOPMENT.md](DEVELOPMENT.md).


## Alur kerja

1. **Buat issue** untuk fitur baru atau bug yang ditemukan
2. **Fork** repo dan buat branch dari `main`:
   ```bash
   git checkout -b feat/nama-fitur
   # atau
   git checkout -b fix/nama-bug
   ```
3. Tulis kode — ikuti konvensi di bawah
4. Jalankan linter dan tests:
   ```bash
   uv run ruff check . && uv run ruff format .
   uv run pytest
   ```
5. Commit dengan pesan yang jelas:
   ```bash
   git commit -m "feat: tambah adapter untuk sumber X"
   ```
6. Buat **Pull Request** ke `main`


## Konvensi kode

- Linter & formatter: **ruff** (line length 100, target Python 3.12)
- Nama variabel/fungsi: `snake_case` — nama kelas: `PascalCase`
- `verbose_name` pada model selalu dalam Bahasa Indonesia
- Endpoint baru selalu di bawah `/api/v1/`
- Gunakan `get_or_create` / `update_or_create` untuk upsert agar idempoten
- Tulis komentar hanya untuk menjelaskan *kenapa*, bukan *apa*


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


## Menambah kata kunci kurasi

Kata kunci bisa ditambah langsung dari panel admin (menu **Kata Kunci**), atau lewat perintah:

```bash
# Edit KEYWORDS di curation/management/commands/seed_keywords.py
uv run python manage.py seed_keywords
```


## Pertanyaan?

Buka [issue](https://github.com/papuaopensource/tabaca-backend/issues) atau diskusi di repo utama [tabaca](https://github.com/papuaopensource/tabaca).
