# Development Guide

How to run, develop, and deploy Tabaca locally. For an overview of the project, see the [README](README.md).

## Stack

| Part            | Technology                                                                         |
| --------------- | ---------------------------------------------------------------------------------- |
| Monorepo        | [Turborepo](https://turborepo.com) + [pnpm workspaces](https://pnpm.io/workspaces) |
| Extension       | [WXT](https://wxt.dev) 0.21, React 19, TypeScript 6, Tailwind CSS 4                |
| Extension tests | Vitest 5, Testing Library, WXT fake browser                                        |
| Backend         | Django 6.1, Django REST Framework 3.18, [Unfold](https://unfoldadmin.com) admin    |
| Backend tooling | [uv](https://docs.astral.sh/uv/), ruff, pytest                                     |
| Database        | SQLite (development) / PostgreSQL (production)                                     |
| Feed parsing    | feedparser, BeautifulSoup                                                          |

## Prerequisites

- **Node.js 24** or newer
- **pnpm 10** (`corepack enable` picks up the version pinned in `package.json`)
- **Python 3.12** or newer
- **[uv](https://docs.astral.sh/uv/getting-started/installation/)**

## Repository layout

```
tabaca/
├── apps/
│   ├── extension/              # Browser extension (WXT)
│   │   ├── entrypoints/
│   │   │   ├── background.ts   # Service worker: refreshes the feed every 30 min
│   │   │   └── newtab/         # New tab page (HTML + React entry)
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── hooks/          # React hooks (feed, "For you" order, refresh, clock)
│   │   │   ├── lib/            # Feed refresh, story picking, time, search helpers
│   │   │   ├── storage/        # Typed browser.storage items
│   │   │   └── styles/         # Tailwind CSS 4 theme (dark, neutral)
│   │   ├── assets/             # Logos (bundled)
│   │   └── public/             # Extension icons (copied as-is)
│   └── backend/                # Django project (Python, managed with uv)
│       ├── django_project/     # Settings (base / development / production), URLs
│       ├── stories/            # Source, Story, FetchLog; feeds, safety, services, API
│       └── curation/           # Keyword, BlockedKeyword; relevance + blocklist filter
├── packages/
│   ├── api/                    # @tabaca/api: typed API client + URL safety helpers
│   └── eslint-config/          # @tabaca/eslint-config: shared flat configs
├── turbo.json                  # Task pipeline
└── pnpm-workspace.yaml
```

The backend is a Python project. It has a small `package.json` so Turborepo can run its `dev`, `test`, `lint`, and `format` tasks through `uv`.

## Setup

```bash
# 1. JavaScript dependencies (all workspaces)
pnpm install

# 2. Backend
cd apps/backend
uv sync
cp .env.example .env
uv run python manage.py migrate
uv run python manage.py seed_sources      # default news sources
uv run python manage.py seed_keywords     # Papua keywords + blocklist
uv run python manage.py createsuperuser
uv run python manage.py fetch_stories     # first fetch
cd ../..

# 3. Extension
cp apps/extension/.env.example apps/extension/.env
```

## Running locally

```bash
pnpm dev
```

This applies pending database migrations, starts the Django server on `http://localhost:8000`, and runs the WXT dev build in watch mode.

- API: `http://localhost:8000/api/v1/`
- Admin panel: `http://localhost:8000/site-manager/`

To run one app only:

```bash
pnpm --filter @tabaca/backend dev
pnpm --filter @tabaca/extension dev
pnpm --filter @tabaca/extension dev:firefox
```

If port 8000 is taken, run the backend on another port and point the extension at it:

```bash
cd apps/backend && uv run python manage.py runserver 8010
# apps/extension/.env
VITE_API_BASE_URL=http://localhost:8010
```

### Loading the extension

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select:
   - `apps/extension/.output/chrome-mv3-dev` while running `pnpm dev`
   - `apps/extension/.output/chrome-mv3` after `pnpm build`
3. Open a new tab.

WXT 0.21 only opens a browser automatically if `web-ext` is installed. To get that behavior, run `pnpm --filter @tabaca/extension add -D web-ext`.

## Scripts

Run these from the repository root. Turborepo runs each task in every workspace that defines it.

| Command             | What it does                                                                |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`          | Backend server + extension dev build                                        |
| `pnpm build`        | Production build of the extension (`apps/extension/.output/chrome-mv3`)     |
| `pnpm package`      | Zip for store upload (`apps/extension/.output/tabaca-<version>-chrome.zip`) |
| `pnpm test`         | Vitest (extension, API client) and pytest (backend)                         |
| `pnpm lint`         | ESLint (TypeScript) and ruff (Python)                                       |
| `pnpm typecheck`    | `tsc --noEmit` for the TypeScript workspaces                                |
| `pnpm format`       | Prettier for TypeScript/JSON/Markdown, ruff format for Python               |
| `pnpm format:check` | Check formatting without writing                                            |

## Environment variables

### Extension (`apps/extension/.env`)

| Variable            | Default                 | Notes                                                                                                                       |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend origin (without `/api/v1`). Also becomes the extension's host permission, so set it at **build time** for releases. |

### Backend (`apps/backend/.env`)

| Variable                                                  | Notes                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `SECRET_KEY`                                              | Required in production                                                                        |
| `DEBUG`                                                   | `True` in development                                                                         |
| `ALLOWED_HOSTS`                                           | Comma-separated                                                                               |
| `CORS_ALLOWED_ORIGINS`                                    | Comma-separated. The extension doesn't need CORS, because its host permission covers the API. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL, production only                                                                   |

Settings live in `apps/backend/django_project/settings/`:

| File             | Used for                                   |
| ---------------- | ------------------------------------------ |
| `base.py`        | Shared configuration                       |
| `development.py` | Local: SQLite, open CORS, `DEBUG = True`   |
| `production.py`  | Server: PostgreSQL, HTTPS, `DEBUG = False` |

`manage.py` and pytest default to `development`; `wsgi.py` and `asgi.py` default to `production`.

## How stories flow

### Backend

1. `fetch_stories` loads every **active source** and downloads its feed with one generic fetcher (`stories/feeds.py`): RSS, Atom, a WordPress REST API posts URL, or an OpenAlex works URL (scholarly papers). Sources need no custom code.
2. Each entry is normalized (title, snippet, author, date, image) and checked (`stories/services.py`):
   - **Link safety.** The article link must be http(s) and point at one of the source's allowed domains (subdomains included). Otherwise the entry is rejected.
   - **Blocklist.** If the title, snippet, or URL slug contains an active blocked term, the entry is rejected.
   - **Relevance.** Active keyword weights are added up, and the story passes at a score of 1 or more. Sources marked **Feed khusus Papua** skip this step. The matched keywords and region (IDN/PNG) are stored with the story either way.
   - **Clean links.** Tracking parameters (`utm_*`, `fbclid`, …) are removed from article links.
   - **Thumbnail required for articles.** Papers (`kind = paper`: journal articles, books, reports) are exempt; the extension shows a typographic cover with the journal or publisher instead. Only `https` images count, and images found inside the article HTML must be real image files (`.jpg`, `.png`, `.webp`, …). If the feed has none, the article page's preview image (`og:image`) is used. Tracking pixels (view counters such as `counter.theconversation.com`), 1×1 images and avatars are ignored. If there is still no image, the entry is skipped. Existing stories without a usable thumbnail are repaired once on the next fetch.
3. Every run ends with a **re-check** of stored stories. Stories that now match the blocklist, fail the link rule, or have no safe thumbnail are deactivated. Adding a blocked term therefore also hides older stories. The re-check only ever deactivates; it never re-activates a story an admin hid.
4. Every run is recorded in **Log Pengambilan** (`FetchLog`) with counts of stories that passed, new stories, and rejected entries.

Schedule `fetch_stories` on the server, for example every 30 minutes with cron:

```cron
*/30 * * * * cd /srv/tabaca/apps/backend && uv run python manage.py fetch_stories
```

### Extension

- The background service worker calls the API on install and then every 30 minutes. A new tab also triggers a refresh when the cache is older than 30 minutes.
- Each refresh **replaces** the local cache with up to 1000 stories from `GET /api/v1/stories/` (the whole collection for now; about 1.5 MB). If the collection grows past that, the newest 1000 are kept, so consider a retention rule per source. Stories hidden in the backend, or from a feed an admin switched off, disappear on the next refresh.
- `@tabaca/api` validates every response: unsafe links (`javascript:` and similar) are dropped and non-https images are removed.
- **For you** orders all cached stories by weighted random sampling (`src/lib/curate.ts`). The weighting favors recent stories (decaying over about a month, with a floor so older essays keep appearing), more keyword matches, and stories not shown in the last 14 days. Within any 4 consecutive cards, at most 2 come from the same source. The order is new on every tab and stable while the tab is open. **Latest** sorts by publish date. Tabs above the grid filter either view by type (All, Articles, Research = `kind`), with counts; there is deliberately no per-source filter. Both views show 12 cards and load 12 more as you scroll (infinite scroll; a button appears only if the browser lacks `IntersectionObserver`).
- Clicking a card opens a summary dialog (← → step through the current view). **Read full story**, or ⌘/Ctrl/middle-clicking a card, opens the article in a new tab and reports it once per browser to `POST /api/v1/stories/{id}/read/`. Opening the summary alone doesn't count. The counter comes back as `readCount` on the next refresh and is shown as the card's read stat. No user data is sent.
- Cards show the article's domain as plain attribution, or the journal/publisher for papers. Papers without an image get a "Research" cover; their dialog says **Read full text** and links to the DOI. The extension doesn't use the sources endpoint.
- The UI is dark only. The sidebar state is kept in `localStorage`; feed data lives in `browser.storage.local`.

## Managing sources

Tabaca is **not a daily news site**. Add only feeds of essays, opinion, analysis or research (an outlet's opinion section, a Papua topic or category), and prefer feeds whose posts have images. Sources are data, not code. In the admin panel (**Sumber**):

| Field                  | Notes                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | Slug, e.g. `suara-papua`. Locked after creation (it's part of the public API).                                                                  |
| `name`                 | For admins; the extension shows the article's domain instead                                                                                    |
| `homepage`, `feed_url` | An RSS or Atom feed, or a WordPress REST API posts URL (see below). Empty for a manual source.                                                  |
| `strict_relevance`     | **Relevansi ketat**: for outlets that also write about other topics, a story must name Papua in its title or have a summary clearly about Papua |
| `papua_only`           | **Feed khusus Papua**: every post is about Papua (a Papua topic or category), so the keyword filter is skipped                                  |
| `allowed_domains`      | Domains article links may point to, comma-separated (e.g. `bbc.com, bbc.co.uk`). Leave empty to use the homepage's domain.                      |
| `is_active`            | Turning a source off hides it **and its stories** from the API immediately                                                                      |

Select one or more sources and run the **Ambil cerita sekarang** action to fetch them right away.

To change the defaults used by new installs, edit `SOURCES` in `apps/backend/stories/management/commands/seed_sources.py`. Re-seeding updates names and feed settings, but never changes whether an existing source is active.

Default feeds: Kajian ilmiah — Jurnal and Buku & laporan (OpenAlex), The Conversation Indonesia (topic Papua), Sastra Papua (essays, opinion, reviews), Suara Papua (Opini and Catatan columns), Lao-Lao Papua (essays and critique, without event posts), Mojok (Esai), New Mandala, Asia Pacific Report (Commentary), DaengGassing.com (category Papua), and Antara Papua (Artikel). Re-seeding switches off retired defaults (the earlier news feeds: Jubi, BBC, Antara news, …).

### Research papers (OpenAlex)

Two default sources query [OpenAlex](https://openalex.org), an open index of research. Both return only open-access works with a DOI and an abstract, and "Papua" in the title (excluding Papua New Guinea):

- **Kajian ilmiah — Jurnal**: journal articles and reviews since 2022, in [DOAJ](https://doaj.org)-listed journals, in the social sciences, arts & humanities, environmental science and economics.
- **Kajian ilmiah — Buku & laporan**: books, chapters (e.g. ANU Press) and reports since 2015, also biology for biodiversity surveys, excluding Atlantis Press proceedings.
- **Kajian kampus Indonesia** (five sources, one per field: Sosial & Budaya, Bisnis & Ekonomi, Teknologi, Lingkungan & Pertanian, Kesehatan): articles whose authors are affiliated with an Indonesian institution (Universitas Cenderawasih, Universitas Papua, Musamus, UI, UGM, BRIN, …), the 30 most cited since 2020 per field. Political science is excluded. Indonesian campuses publish thousands of Papua papers a year, so sorting by citations keeps the collection substantial and bounded; one source per field keeps any single field from dominating.

The abstract becomes the summary, the authors and journal are stored (`author`, `venue`), and the link is the DOI (`allowed_domains = doi.org`). To change the selection, edit the `filter` in the feed URL; the [OpenAlex docs](https://docs.openalex.org) list the filters.

### Single articles ("Pilihan Tabaca")

Good writing often lives on sites we don't follow as a whole. Add it by hand:

- Admin panel: **Cerita → Tambah**, paste the article URL. Title, summary, author, date and thumbnail come from the page's preview metadata (OpenGraph). Fill in the optional fields to override them, for example when a page has no preview image.
- Command line: `uv run python manage.py add_story https://example.com/esai/ [--title … --snippet … --image …]`

Pages with scholarly `citation_*` tags (most journal sites, including OJS) are recognized as papers automatically. For a report or a PDF, choose **Paper / jurnal** and fill in the title and publisher (`--paper --venue …` on the command line); no thumbnail is needed.

Picked articles are stored under the manual source **Pilihan Tabaca** (`pilihan`). They don't need Papua keywords, because a person chose them. The blocklist, link and thumbnail rules still apply.

### General-interest sites

For sites that write about many topics, point the source at a Papua-only feed, so the newest posts don't push out the Papua ones:

- WordPress category or tag feeds, such as `https://example.com/category/papua/feed/`.
- If a site's feeds all redirect to one FeedBurner feed, use the WordPress REST API instead. Look up the category id at `https://example.com/wp-json/wp/v2/categories?slug=papua`, then use `https://example.com/wp-json/wp/v2/posts?categories=<id>&per_page=100&_embed=wp:featuredmedia,author`. DaengGassing.com is set up this way.

Every story still goes through the same relevance and safety checks.

### Sites with a broken HTTPS chain

Some sites don't send the right intermediate certificate. Browsers fix this on their own, but the fetcher then fails with `CERTIFICATE_VERIFY_FAILED`. Instead of turning verification off, add the missing public intermediate to `apps/backend/stories/certs/extra-intermediates.pem`; the file explains how. Verification stays strict: every chain must still end at a root in the system trust store. DaengGassing.com needs this today (Sectigo DV R36).

## Curation

- **Kata Kunci** (`Keyword`): relevance terms with a region (IDN / PNG / BOTH) and a weight (1 = weak, 2 = strong). Matching is case-insensitive and whole-word.
- **Kata Terlarang** (`BlockedKeyword`): terms that make a story unsafe, in the categories gambling, adult, graphic, spam, and other. The default list is deliberately narrow: promotional gambling/adult spam and explicit graphic-content warnings. It does **not** block reporting on conflict, violence, or human rights in Papua.

Defaults live in `apps/backend/curation/management/commands/seed_keywords.py`. Re-seeding:

- deactivates ambiguous terms that were retired (e.g. `Dani`, a common personal name),
- adds new blocked terms but keeps any term an admin switched off.

## API

Base URL: `/api/v1/`. Responses are camelCase and paginated (`?page_size=` up to 200).

| Endpoint                          | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `GET /api/v1/stories/`            | Active stories from active sources, newest first       |
| `GET /api/v1/stories/{id}/`       | One story                                              |
| `GET /api/v1/sources/`            | Active sources                                         |
| `GET /api/v1/fetch-logs/`         | Fetch history                                          |
| `POST /api/v1/stories/{id}/read/` | Anonymous read counter (rate limited per IP: 600/hour) |

Filters for stories: `?source=sastrapapua`, `?region=IDN`, `?search=Jayapura`, `?ordering=-published_at` (or `-read_count`), `?page=2`.

```json
{
  "id": "f0d01a31684aabaf",
  "title": "IPMNI Jayapura Desak Usut Penembakan Tiga Warga Sipil di Nduga",
  "url": "https://suarapapua.com/2026/11/09/…",
  "source": "suara-papua",
  "author": "CR SP",
  "publishedAt": "2026-11-09T08:00:00+09:00",
  "snippet": "…",
  "imageUrl": "",
  "matchedKeywords": ["Jayapura", "Nduga"],
  "fetchedAt": "2026-11-10T01:30:04+09:00",
  "region": "IDN",
  "readCount": 0
}
```

```json
{
  "id": "suara-papua",
  "name": "Suara Papua",
  "homepage": "https://suarapapua.com",
  "feedUrl": "https://suarapapua.com/feed/",
  "isActive": true,
  "lastFetchAt": "2026-11-10T01:30:04+09:00",
  "lastError": "",
  "storyCount": 8
}
```

## Management commands

Run from `apps/backend`:

```bash
uv run python manage.py fetch_stories                 # all active sources (+ re-check)
uv run python manage.py fetch_stories --source sastrapapua  # one source
uv run python manage.py add_story <url>                # add a single article by hand
uv run python manage.py recheck_stories               # re-apply blocklist, link and thumbnail rules now
uv run python manage.py seed_sources                  # default sources
uv run python manage.py seed_keywords                 # keywords + blocklist
uv run python manage.py seed_keywords --clear         # reset both completely
```

## Tests and linting

```bash
pnpm test          # everything
pnpm lint
pnpm typecheck

# Per workspace
pnpm --filter @tabaca/extension test
pnpm --filter @tabaca/api test
cd apps/backend && uv run pytest && uv run ruff check . && uv run ruff format --check .
```

The backend tests include a smoke test that renders every admin page, which guards Unfold upgrades.

## Deployment notes

- Build the extension with the production API origin: `VITE_API_BASE_URL=https://api.example.org pnpm package`.
- Run the backend with `DJANGO_SETTINGS_MODULE=django_project.settings.production` (the default for WSGI/ASGI). The PostgreSQL driver (`psycopg`) is included in the backend dependencies.
- Schedule `fetch_stories` as shown above.
- Some outlets block requests from certain networks. For example, `jubi.id` returned HTTP 403 to automated requests during development. The fetcher identifies itself honestly as `Tabaca/0.1`, and failures appear in **Log Pengambilan** and in the source's `last_error`.
