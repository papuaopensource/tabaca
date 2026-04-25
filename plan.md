# Tabaca — Rencana Pengembangan PoC

> **Stories from Papua, One Tab Away**
>
> Browser extension yang menampilkan cerita dan informasi terkurasi tentang Papua dari berbagai sumber kredibel, tepat di halaman *new tab* pengguna.

---

## 1. Ringkasan Proyek

### 1.1 Visi
Menjadikan setiap tab baru di browser sebagai gerbang belajar tentang Papua. Setiap kali pengguna membuka tab, mereka disuguhkan cerita, berita, dan opini terkurasi yang membantu memahami apa yang sebenarnya terjadi di Papua — dari sumber-sumber yang kredibel.

### 1.2 Misi
- Mengumpulkan dan menyajikan cerita Papua dari sumber tepercaya dalam satu tempat.
- Memberikan pengalaman membaca yang tenang, tidak mengganggu, dan mendidik.
- Menjadi proyek *open source* yang dikelola komunitas (Komunitas Papua Open Source).

### 1.3 Identitas Proyek
| Atribut | Nilai |
|---|---|
| Nama | Tabaca |
| Tagline | Stories from Papua, One Tab Away |
| Inisiator | Komunitas Papua Open Source |
| Lisensi | MIT |
| Tipe | Browser Extension (New Tab Replacement) |
| Target Awal | Chromium-based (Chrome, Edge, Brave) |

### 1.4 Etimologi
"Tabaca" terinspirasi dari kata yang familiar di Papua — dipilih agar identitas proyek berakar pada budaya lokal sekaligus mudah diingat secara global.

---

## 2. Tujuan PoC

PoC ini bertujuan **membuktikan kelayakan konsep** secara teknis dan pengalaman pengguna, **tanpa** harus membangun seluruh infrastruktur backend terlebih dahulu.

### 2.1 Tujuan Utama
1. Menghasilkan extension yang **fungsional** menampilkan feed cerita Papua di halaman *new tab*.
2. Memvalidasi **pengalaman pengguna** — apakah tampilan new tab berisi cerita ini terasa nyaman, tidak mengganggu, dan bermanfaat.
3. Memvalidasi **alur kurasi** — bagaimana memastikan hanya konten relevan dengan Papua yang tampil dari RSS umum seperti BBC.
4. Memberi **landasan arsitektur** yang mudah di-*extend* ke arah client-server saat backend Django mulai dibangun.

### 2.2 Non-Goals (PoC)
Hal-hal berikut **tidak** termasuk dalam lingkup PoC agar tim tetap fokus:
- Backend Django & Django Unfold admin (fase berikutnya).
- Akun pengguna, autentikasi, personalisasi.
- Multi-bahasa / i18n (PoC fokus ke **satu bahasa** — lihat §5.3).
- Notifikasi push, offline reading yang kompleks, atau sinkronisasi antar perangkat.
- Publikasi ke Chrome Web Store (boleh disiapkan, tapi bukan gate keberhasilan PoC).
- Monetisasi / analitik pengguna.

### 2.3 Kriteria Sukses PoC
PoC dianggap berhasil bila:
- [ ] Extension ter-*install* lokal (unpacked) dan membuka halaman Tabaca setiap new tab dibuka.
- [ ] Feed menampilkan minimal **20 cerita terkurasi** dari minimal **2 sumber** (The Conversation + BBC).
- [ ] Filter "hanya konten Papua" berjalan otomatis dengan *false positive rate* dapat diterima (target: ≤ 10% dari hasil review manual sampel).
- [ ] Halaman new tab *loading* dalam ≤ 1 detik pada cache hangat.
- [ ] Desain lolos *usability review* internal oleh minimal 3 anggota komunitas (rating "nyaman dipakai setiap hari").

---

## 3. Arsitektur

### 3.1 Arsitektur Target (Jangka Panjang)
```
┌─────────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│ Browser Extension   │  ───▶ │  Django Backend      │  ───▶ │ Source RSS /     │
│ (Plasmo + React)    │  API  │  (Django Unfold      │  Poll │ Blog / API       │
│                     │ ◀───  │   Admin + DRF)       │ ◀───  │                  │
└─────────────────────┘       └──────────────────────┘       └──────────────────┘
```

### 3.2 Arsitektur PoC (Fase Sekarang)
Untuk PoC, **tidak ada backend**. Extension melakukan *fetching* dan filtering langsung dari browser:

```
┌──────────────────────────────────────┐
│ Browser Extension (Plasmo)           │
│ ┌────────────────────────────────┐   │       ┌──────────────┐
│ │ Background Service Worker      │ ──┼────▶  │ RSS Sources  │
│ │ - Scheduled fetch (alarms)     │ ◀─┼─────  │ (BBC, TCO)   │
│ │ - RSS parsing                  │   │       └──────────────┘
│ │ - Keyword filter (Papua-scope) │   │
│ │ - Cache to chrome.storage      │   │
│ └────────────────────────────────┘   │
│              │                       │
│              ▼                       │
│ ┌────────────────────────────────┐   │
│ │ New Tab Page (React + Tailwind)│   │
│ │ - Render feed dari storage     │   │
│ │ - Search / filter client-side  │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 3.3 Prinsip Desain Arsitektur
- **Modular source adapter** — setiap sumber (BBC, TCO, Jubi, blog, dll.) adalah *adapter* dengan *interface* yang sama. Menambah sumber = menambah file adapter.
- **Storage sebagai single source of truth untuk UI** — UI hanya baca `chrome.storage`, tidak pernah *fetch* langsung. Ini memudahkan migrasi ke backend: cukup ganti *writer* dari "background worker" ke "Django API".
- **Content/Presentation terpisah** — semua logika fetching/parsing/filtering di `background/`, semua UI di `newtab/`. Tidak ada logika bisnis di komponen.

---

## 4. Stack Teknologi

### 4.1 PoC Stack
| Layer | Tool | Alasan |
|---|---|---|
| Extension framework | **Plasmo** | DX terbaik untuk extension modern, dukungan React + TS + Tailwind *out-of-the-box*, hot reload. |
| UI Library | **React 18** | Standar komunitas, ekosistem luas. |
| Bahasa | **TypeScript** | Type safety penting untuk *source adapter* yang banyak. |
| Styling | **TailwindCSS** | Cepat iterasi, konsisten, *utility-first*. |
| State (client) | **Zustand** atau React Context | Ringan; tidak butuh Redux untuk PoC. |
| RSS Parser | **rss-parser** atau custom `DOMParser` | Kecil dan cukup untuk XML feed. |
| HTML Sanitizer | **DOMPurify** | Keamanan saat render *snippet*. |
| Icons | **lucide-react** | Ringan, konsisten dengan estetika minimal. |
| Formatting tanggal | **date-fns** | Tree-shakeable, ringan. |
| Linting | ESLint + Prettier | Standar. |
| Testing | Vitest + React Testing Library | Ringan dan cepat. |

### 4.2 Stack Jangka Panjang (Referensi)
- **Backend**: Django + Django REST Framework
- **Admin UI**: Django Unfold
- **Scheduler**: Celery + Redis / Django-Q
- **DB**: PostgreSQL
- **Deployment**: Docker + (VPS / Fly.io / Railway)

---

## 5. Lingkup Fungsional PoC

### 5.1 Fitur Inti
1. **New Tab Feed**
   - Daftar cerita dalam bentuk card: judul, *snippet* ringkas, sumber, tanggal, gambar thumbnail (jika ada).
   - Klik card → buka artikel asli di tab baru.
2. **Source Aggregation**
   - Fetch RSS dari minimal 2 sumber di fase 1: **The Conversation** dan **BBC**.
   - Disiapkan adapter untuk **Jubi** dan **Antara Papua** (dapat diaktifkan di fase 2 PoC).
3. **Kurasi Otomatis (Papua Scope Filter)**
   - Setiap item feed di-*scan* terhadap *keyword list* (contoh: "Papua", "West Papua", "Papua Barat", "Jayapura", "Merauke", "Sorong", "Biak", "OPM", "Port Numbay", dll.).
   - Matching berbasis *word boundary* (hindari false match seperti "Papua New Guinea" jika dinilai di luar scope — keputusan editor komunitas).
   - Item yang tidak lolos filter dibuang.
4. **Refresh Otomatis**
   - Background worker menjalankan fetch setiap **30 menit** (menggunakan `chrome.alarms`).
   - Manual refresh button tersedia di UI.
5. **Search & Filter Client-Side**
   - Search box untuk cari dalam judul/snippet.
   - Filter by source (BBC / TCO / All).
6. **About / Credits Panel**
   - Penjelasan singkat proyek, link GitHub, kredit sumber, lisensi MIT.

### 5.2 Fitur Sekunder (Nice-to-Have PoC)
- **Bookmark lokal** — simpan cerita favorit ke `chrome.storage` (tanpa sync).
- **Toggle sumber** — user bisa menyembunyikan sumber tertentu.
- **Dark mode** — mengikuti system preference.

### 5.3 Kebijakan Bahasa (PoC)
Sesuai arahan, **PoC fokus pada satu bahasa** untuk seluruh UI. **Rekomendasi: Bahasa Indonesia** sebagai bahasa default, karena:
- Target audiens awal adalah komunitas Indonesia yang ingin memahami Papua.
- Sebagian besar sumber (Jubi, Antara) berbahasa Indonesia.
- Konten dari BBC / TCO tetap ditampilkan dalam bahasa aslinya (judul/snippet tidak diterjemahkan di PoC — terjemahan otomatis di luar scope).

> Keputusan final bahasa UI **harus disepakati di kickoff** sebelum sprint 1 dimulai.

---

## 6. Desain & UX

### 6.1 Prinsip Desain
Sesuai brief, new tab page akan **selalu dilihat** pengguna setiap buka tab baru. Maka prinsip wajib:
1. **Clean** — ruang kosong yang cukup, tidak padat.
2. **Simple** — tidak ada elemen dekoratif yang tidak fungsional.
3. **Minimal** — palet warna terbatas (2–3 warna utama).
4. **Informatif** — hirarki visual jelas: judul > sumber/tanggal > snippet.
5. **Tidak mengganggu** — tidak ada animasi berlebihan, tidak ada notifikasi pop-up, tidak ada warna *high-saturation* yang memukul mata.

### 6.2 Arahan Visual
- **Tipografi**: satu *sans-serif* untuk UI (Inter / System UI) + satu *serif* opsional untuk judul cerita (Source Serif / Lora) agar terasa seperti "reading material" bukan dashboard.
- **Warna**:
  - Neutral base (abu-abu lembut / *off-white*) untuk background.
  - 1 accent color — **direkomendasikan**: nuansa hijau/teal yang terinspirasi lanskap Papua, digunakan sparingly.
  - Mendukung light & dark mode.
- **Layout**: grid responsif, maksimal 3 kolom di layar lebar, 1 kolom di sempit.
- **Density**: card berukuran sedang, spasi vertikal generous, line-height nyaman baca.

### 6.3 Struktur Halaman New Tab
```
┌───────────────────────────────────────────────┐
│ [Tabaca logo]     [search]    [⚙] [about]    │  ← Header minimal
├───────────────────────────────────────────────┤
│                                               │
│  Stories from Papua, One Tab Away             │  ← Tagline (subtle, opsional)
│                                               │
│  [All] [BBC] [The Conversation]  🔄           │  ← Filter & refresh
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ card     │  │ card     │  │ card     │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ card     │  │ card     │  │ card     │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│                                               │
│  [load more / infinite scroll]                │
├───────────────────────────────────────────────┤
│ Last updated: 5 min ago · MIT · GitHub        │  ← Footer subtle
└───────────────────────────────────────────────┘
```

### 6.4 Deliverable Desain
- Mood board (Figma / Excalidraw) — oleh designer komunitas.
- Wireframe low-fi halaman new tab (light + dark).
- Design tokens (warna, font, spacing) diekspor ke file Tailwind config.

---

## 7. Struktur Repository

```
tabaca/
├── LICENSE                        # MIT
├── README.md
├── plan.md                        # Dokumen ini
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .github/
│   └── workflows/
│       └── ci.yml                 # lint + typecheck + test
├── assets/
│   ├── icon.png
│   └── logo.svg
├── src/
│   ├── background/
│   │   ├── index.ts               # Service worker entry
│   │   ├── scheduler.ts           # chrome.alarms setup
│   │   └── fetcher.ts             # Orkestrasi fetch semua sumber
│   ├── sources/
│   │   ├── types.ts               # SourceAdapter interface
│   │   ├── bbc.ts
│   │   ├── theconversation.ts
│   │   ├── jubi.ts                # (stub, fase 2)
│   │   └── antara-papua.ts        # (stub, fase 2)
│   ├── curation/
│   │   ├── keywords.ts            # Daftar keyword Papua
│   │   ├── filter.ts              # Matcher + scoring
│   │   └── filter.test.ts
│   ├── storage/
│   │   ├── index.ts               # Wrapper chrome.storage
│   │   └── schema.ts              # Tipe Story, CacheMeta
│   ├── newtab/
│   │   ├── index.html             # Plasmo new tab entry
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── StoryCard.tsx
│   │   │   ├── SourceFilter.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useStories.ts
│   │   │   └── useRefresh.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── options/                   # (opsional) halaman settings
│   │   └── index.tsx
│   └── lib/
│       ├── rss.ts                 # Parser RSS
│       ├── sanitize.ts            # Wrapper DOMPurify
│       └── date.ts
└── tests/
    └── e2e/                       # (fase 2) Playwright
```

---

## 8. Model Data

### 8.1 `Story`
```ts
interface Story {
  id: string;               // hash(url)
  title: string;
  url: string;
  source: SourceId;         // 'bbc' | 'theconversation' | ...
  author?: string;
  publishedAt: string;      // ISO
  snippet: string;          // plain text, sudah sanitized
  imageUrl?: string;
  matchedKeywords: string[]; // untuk debugging / transparency
  fetchedAt: string;        // ISO
}
```

### 8.2 `SourceAdapter` (interface)
```ts
interface SourceAdapter {
  id: SourceId;
  name: string;
  homepage: string;
  fetch(): Promise<RawItem[]>;     // ambil raw RSS/JSON
  normalize(raw: RawItem): Story;  // map ke Story
}
```

### 8.3 `chrome.storage` layout
- `tabaca:stories` → `Story[]` (di-sort DESC by `publishedAt`, max 200 item).
- `tabaca:meta` → `{ lastFetchAt, lastError, sourceStats }`.
- `tabaca:prefs` → `{ enabledSources, theme, hiddenStoryIds[] }`.

---

## 9. Strategi Kurasi (Papua Scope Filter)

Kurasi adalah **inti kualitas** PoC. Pendekatan:

### 9.1 Keyword Matching (v1 — PoC)
- Daftar *keyword* disimpan di [src/curation/keywords.ts](src/curation/keywords.ts).
- Matching dilakukan terhadap `title + snippet` (case-insensitive, word boundary).
- Setiap item mendapat `score = jumlah unique keyword match`.
- Threshold awal: `score ≥ 1` lolos.

### 9.2 Ambiguitas "Papua New Guinea"
Perlu keputusan komunitas: apakah cerita *tentang Papua New Guinea* (negara tetangga) masuk scope? Rekomendasi PoC: **iya, tapi diberi tag berbeda** — karena secara geografis dan kultural erat. Implementasi: keyword `"Papua New Guinea"` tetap match, tapi adapter memberi flag `region: 'PNG'` vs `region: 'IDN'`.

### 9.3 Iterasi
- Sprint review: sampling 30 artikel hasil filter, tandai *false positive* dan *false negative*.
- Tuning keyword list setiap akhir sprint.

### 9.4 Masa Depan (Post-PoC)
- Kurasi manual oleh editor komunitas lewat Django Unfold admin (approve/reject).
- Klasifikasi berbasis ML ringan (opsional, jika volume besar).

---

## 10. Roadmap & Milestone

Estimasi: **±8 minggu** untuk PoC, asumsi tim inti 2–4 kontributor *part-time*.

### Sprint 0 — Fondasi (Minggu 1)
- [ ] Setup repo, lisensi, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`.
- [ ] Inisiasi Plasmo project + Tailwind + TS config.
- [ ] CI dasar (lint + typecheck).
- [ ] Keputusan final: bahasa UI, nama-nama source, palet warna.

### Sprint 1 — Vertical Slice (Minggu 2–3)
- [ ] Source adapter untuk **The Conversation** (paling mudah, RSS bersih).
- [ ] Background worker: fetch + simpan ke storage (tanpa schedule dulu, manual trigger).
- [ ] Keyword filter v1 + test.
- [ ] New tab page super-minimal: list judul + link. Belum styled.
- [ ] **Demo**: buka new tab, lihat cerita TCO terfilter.

### Sprint 2 — Adapter Kedua + Penjadwalan (Minggu 4)
- [ ] Adapter **BBC**.
- [ ] `chrome.alarms` scheduler (30 min).
- [ ] Error handling & retry strategy sederhana.
- [ ] Meta: `lastFetchAt`, status per-source.

### Sprint 3 — Desain & UX (Minggu 5–6)
- [ ] Implementasi desain final: Header, StoryCard, SourceFilter, SearchBar, EmptyState, Footer.
- [ ] Dark mode.
- [ ] Loading & error states.
- [ ] Responsiveness.
- [ ] Usability review internal.

### Sprint 4 — Polish & Packaging (Minggu 7–8)
- [ ] About panel + kredit sumber.
- [ ] Bookmark lokal (nice-to-have).
- [ ] Options page (toggle sumber).
- [ ] Build produksi, uji di Chrome & Edge & Brave.
- [ ] Dokumentasi: README, panduan install unpacked, panduan kontribusi adapter baru.
- [ ] **Demo akhir PoC** ke komunitas.

---

## 11. Pembagian Peran (Saran Komunitas)

| Peran | Tanggung Jawab |
|---|---|
| **Tech Lead** | Arsitektur, review PR, keputusan teknis. |
| **Frontend Dev** (1–2) | New tab UI, komponen React, Tailwind. |
| **Extension Dev** (1) | Background worker, adapter, storage, scheduler. |
| **Designer** | Mood board, wireframe, design tokens, review visual. |
| **Editor/Kurator** | Review output filter, tuning keyword, daftar sumber kredibel. |
| **QA / Reviewer** | Usability testing, bug report, dokumentasi alur. |

---

## 12. Alur Kontribusi (Open Source)

- Branch strategy: `main` (stable) + feature branches (`feat/...`, `fix/...`).
- Semua perubahan via Pull Request dengan minimal 1 review.
- Commit convention: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, ...).
- Issue templates: *bug*, *feature request*, *new source proposal*.
- Setiap sumber baru wajib melewati **"source proposal" issue** dulu (menjaga kualitas kurasi).

---

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| RSS *provider* berubah format / menghilang | Sumber mati mendadak | Adapter terisolasi, error per-source tidak merobohkan feed lain. Tambah monitoring sederhana. |
| Filter keyword *false positive* tinggi | Kredibilitas turun | Review sampling tiap sprint, iterasi keyword, flag "report this story" di UI (post-PoC). |
| CORS saat fetch RSS di background worker | Fetch gagal | Manifest v3 service worker bypass CORS untuk *declared host permissions*. Pastikan `host_permissions` di manifest benar. |
| Performa new tab lambat | UX buruk — new tab **selalu** dibuka | UI baca dari storage (instant), fetch di background. Budget load ≤ 1 detik. |
| *Scope creep* ke fitur besar | PoC molor | §2.2 non-goals ditegaskan. PR di luar scope → ditutup dengan arahan ke roadmap post-PoC. |
| Kontributor *part-time* → momentum hilang | Delivery lambat | Sprint pendek (1–2 minggu), demo kecil berkala, vertical slice Sprint 1 supaya ada *proof* cepat. |

---

## 14. Legal & Etika

- **Lisensi kode**: MIT.
- **Konten feed**: hanya menampilkan judul + snippet + link ke sumber asli. **Tidak** me-*re-host* artikel penuh. Ini mengikuti praktik RSS reader standar.
- **Attribution**: nama sumber tampil jelas di setiap card + panel About.
- **Privasi pengguna**: PoC **tidak** mengumpulkan data pengguna (no analytics, no tracking). Ditegaskan di README dan About.
- **Konten sensitif**: karena isu Papua dapat sensitif, tim editor komunitas menetapkan *editorial policy* sederhana — misal: utamakan sumber jurnalistik, tandai opini sebagai opini.

---

## 15. Kesiapan ke Fase Berikutnya (Post-PoC)

Arsitektur PoC sudah dirancang agar migrasi ke client-server mulus:
1. `SourceAdapter` dipindah ke Django sebagai *job*. Extension tidak perlu lagi fetch langsung.
2. Layer `storage/` di extension diganti dengan *API client* yang memanggil endpoint Django (`GET /stories/`).
3. UI new tab **tidak berubah** karena sudah hanya baca dari abstraksi storage.
4. Editor komunitas mulai pakai Django Unfold untuk approve/reject, tag, dan kurasi manual.

---

## 16. Checklist Kickoff

Sebelum Sprint 1 dimulai, pastikan:
- [ ] Repo publik di GitHub dengan README minimal + plan.md ini.
- [ ] Keputusan bahasa UI final.
- [ ] Daftar sumber fase 1 final (minimal 2).
- [ ] Keputusan scope "Papua New Guinea" (in/out).
- [ ] Channel komunikasi komunitas (Discord / Telegram / GitHub Discussions).
- [ ] Anggota tim inti teridentifikasi (lihat §11).

---

*Dokumen ini hidup — silakan diupdate melalui PR saat keputusan penting berubah.*
