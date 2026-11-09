# Contributing to Tabaca

Thanks for your interest in contributing! To set up a development environment, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Workflow

1. **Open an issue** for a new feature or a bug you found.
2. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/short-description
   # or
   git checkout -b fix/short-description
   ```
3. Make your changes, following the conventions below.
4. Run the checks from the repository root:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(extension): add keyboard shortcut for shuffle"
   ```
6. Open a **Pull Request** against `main`.

## Conventions

### TypeScript (extension, packages)

- Formatting with Prettier (no semicolons, double quotes); run `pnpm format`.
- Linting with the shared config in `packages/eslint-config`; type-only imports use `import type`.
- Shared API types and validation belong in `packages/api`, not in an app.
- UI text is written in English, plainly and briefly. Story content keeps its original language, which is mostly Indonesian.

### Python (backend)

- Linting and formatting with **ruff** (line length 100, Python 3.12); run `pnpm format`.
- `snake_case` for variables and functions, `PascalCase` for classes.
- Model `verbose_name` and admin labels are written in Indonesian, for the admins who curate the content.
- New endpoints go under `/api/v1/`.
- Use `get_or_create` / `update_or_create` so commands stay idempotent.

### Everywhere

- Write comments to explain _why_, not _what_.
- Add or update tests with your change.

## Proposing a new source

Tabaca collects essays, opinion, analysis and research (including open-access journal articles, books and reports) about Papua, not daily news. Every new source starts with a **source proposal** issue that includes:

- the outlet's name, homepage, and a feed URL (RSS, Atom, or WordPress REST API), ideally narrowed to its opinion section or a Papua topic,
- why it is worth reading, and how much of it is about Papua,
- whether its posts have images (every article needs a thumbnail; papers and reports don't),
- the domains its article links use, if they differ from the homepage.

For a single good article, there's no need for a proposal: an admin can add it by URL (see DEVELOPMENT.md, "Single articles").

Once it is accepted, an admin adds the source in the admin panel (**Sumber**). No code change is needed. To include it in the defaults for new installs, also add it to `SOURCES` in `apps/backend/stories/management/commands/seed_sources.py`.

## Keywords and the blocklist

Relevance keywords (**Kata Kunci**) and unsafe terms (**Kata Terlarang**) can be edited directly in the admin panel. To change the defaults, edit `apps/backend/curation/management/commands/seed_keywords.py` and run:

```bash
cd apps/backend && uv run python manage.py seed_keywords
```

Keep the blocklist focused on spam and clearly unsafe content. Reporting on conflict, violence, or human rights in Papua must stay visible.

## Questions?

Open an [issue](https://github.com/papuaopensource/tabaca/issues).
