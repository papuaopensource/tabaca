<p align="center">
  <img src="assets/logo-full-transparent.png" alt="Tabaca" width="280" />
</p>

<p align="center">
  <strong>Stories from Papua, One Tab Away</strong>
</p>

<p align="center">
  Tabaca adalah browser extension open source yang menampilkan cerita dan informasi terkurasi tentang Papua dari berbagai sumber kredibel, tepat di halaman tab baru Anda.
</p>

<p align="center">
  Diinisiasi oleh <a href="https://github.com/papuaopensource">Papua Open Source</a> · Lisensi MIT
</p>

---

## Fitur (PoC)

- Feed cerita terkurasi dari BBC, The Conversation, Jubi, dan Antara Papua
- Filter otomatis: hanya konten yang relevan dengan Papua
- Tampilan clean & minimal — sidebar dengan sapaan, kutipan, dan fakta Papua harian
- Refresh otomatis tiap 30 menit via background service worker
- Filter by source
- Bookmark cerita favorit (tersimpan lokal)
- Dark mode (mengikuti system preference)

## Stack

- [WXT](https://wxt.dev/) + React 18 + TypeScript
- TailwindCSS
- fast-xml-parser (RSS parsing di service worker)
- DOMPurify

## Cara Menjalankan

### Prasyarat

- Node.js ≥ 18
- npm ≥ 9

### Development

```bash
npm install
npm run dev
```

Buka Chrome → `chrome://extensions` → aktifkan *Developer mode* → *Load unpacked* → pilih folder `.output/chrome-mv3`.

### Build

```bash
npm run build
```

Output ada di `.output/chrome-mv3`.

### Package (zip untuk distribusi)

```bash
npm run package
```

## Struktur Proyek

```
entrypoints/
  background.ts          # Background service worker
  newtab/                # New tab page (HTML + React entry)
src/
  sources/               # Source adapters (BBC, TCO, Jubi, Antara)
  curation/              # Keyword filter Papua
  storage/               # chrome.storage wrapper
  lib/                   # RSS parser, sanitize, date utils
  components/            # UI components
  hooks/                 # React hooks
  styles/                # Global CSS
public/                  # Static assets (icons)
```

## Kontribusi

Setiap sumber baru wajib melalui *source proposal issue* dulu.

Commit convention: [Conventional Commits](https://www.conventionalcommits.org/).

## Sumber

Tabaca hanya menampilkan judul, snippet, dan link ke artikel asli. Tidak ada konten yang di-rehost.

## Lisensi

[MIT](LICENSE) © Papua Open Source
