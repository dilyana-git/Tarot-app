# Arcana — The Tarot Oracle

An interactive tarot web app. Browse all 78 cards of the Major and Minor Arcana,
read up on the history and symbolism of the deck, and draw a reading across five
spreads — each card paired with its position and a narrative composed for that
particular draw.

Flask backend, no database, no build step. Card data is a static Python module;
the frontend is framework-free vanilla JS.

---

## Quickstart

```bash
pip install -r requirements.txt
python app.py                       # http://localhost:5000
```

For an auto-reloading dev server:

```bash
FLASK_DEBUG=true python app.py
```

> **On a fresh clone every card renders without artwork.** `static/images/` and
> `static/media/` are gitignored, so no card art ships with the repository — the
> app is fully functional, just unillustrated. See [Card artwork](#card-artwork).

## Tests

```bash
pip install -r requirements-dev.txt
pytest                              # 33 tests
```

`tests/test_smoke.py` covers route status, the JSON API shapes, the 404/413
handlers, security headers, narrative-composer determinism, and the image-path
placeholder fallback. There is no linter configured.

---

## Configuration

All configuration is environment variables. None are required to run locally;
`SECRET_KEY` is required for a real deployment.

| Variable | Default | Notes |
|---|---|---|
| `SECRET_KEY` | *(insecure dev key)* | Signs sessions. **Required under any WSGI server.** `python app.py` falls back to a dev key with a warning; importing the app — which is what `gunicorn app:app` does — raises at startup instead, so a misconfigured deploy fails loudly rather than serving on a publicly-known key. `FLASK_DEBUG=true` opts out. |
| `FLASK_DEBUG` | `false` | `true` enables the Flask debugger and reloader, and permits the `SECRET_KEY` fallback under a WSGI server. |
| `CORS_ORIGINS` | *(empty)* | Comma-separated origin allowlist. When set, `/api/*` responses carry `Access-Control-Allow-Origin` for matching origins. Empty means no cross-origin access. |
| `PORT` | — | Bound by the `Procfile`. Set by the host platform. |

Request bodies are capped at 64 KB (`MAX_CONTENT_LENGTH` in `app.py`); oversized
requests to `/api/*` get `413 {"error": "Request too large"}`.

---

## Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Homepage. Mosaic card hero over the Major Arcana. |
| `GET` | `/cards` | The deck. Filters: `?filter=major\|minor\|all`, `?suit=Wands\|Cups\|Swords\|Pentacles`. |
| `GET` | `/card/<id>` | Single card detail, with prev/next navigation. IDs are `0`–`77`. |
| `GET` | `/lore` | History & symbolism long-read. |
| `GET` | `/reading` | The reading flow: pick a spread → set an intention → shuffle → deal → reveal. |
| `POST` | `/api/reading` | Draws for a spread. Body: `{"spread": "<key>", "question": "<optional, truncated to 500 chars>"}`. Returns the spread, the drawn cards with position metadata and per-card narrative, and whole-reading notes. |
| `GET` | `/api/cards` | All 78 cards as JSON (public fields only). |
| `GET` | `/health` | `{"status": "ok"}` for load-balancer probes. |

Unknown paths return the themed 404 page, or JSON under `/api/*`.

### Spreads

| Key | Cards | Name |
|---|---|---|
| `single` | 1 | Single Card |
| `three_card` | 3 | Three Card Spread |
| `five_card` | 5 | Five Card Cross |
| `horseshoe` | 7 | Horseshoe Spread |
| `celtic_cross` | 10 | Celtic Cross |

Example:

```bash
curl -s localhost:5000/api/reading \
  -H 'Content-Type: application/json' \
  -d '{"spread":"three_card","question":"What should I focus on?"}'
```

---

## Project layout

```
app.py                  Routes, image resolution, security headers
data/
  tarot_data.py         All 78 cards + SPREADS — the single source of truth
  lore_data.py          Content for /lore
  reading_composer.py   Builds the per-reading narrative
templates/              Jinja templates; all extend base.html
static/
  css/tokens.css        Design tokens — referenced by every other sheet
  css/style.css         Sitewide styles
  css/arcana-*.css      Homepage hero + card widget
  css/lore.css          /lore only
  js/main.js            Sitewide: starfield, nav, scroll behaviour
  js/arcana-card.js     The framework-free mosaic card widget
  js/reading.js         The reading flow
  js/lore.js            /lore interactions
tests/test_smoke.py
```

## Card artwork

Card art is gitignored because of its size, so the repository ships none. The
resolver (`app.py:get_card_image_path`) probes `.webp`, `.jpg`, `.jpeg`, `.png`
in that order and falls back to a placeholder, and the templates degrade to
text-only cards when nothing is found.

To add artwork locally, drop files under `static/images/` following these
conventions:

- **Major arcana** — `major/<slug>.webp`, where the slug is the lowercased name
  with any `the_` prefix stripped and spaces replaced by underscores
  (`high_priestess.webp`).
- **Minor arcana** — `minor/<suit>/<rank>.webp`, lowercase suit, rank spelled out
  (`minor/cups/ace.webp`, `minor/wands/king.webp`).
- **Lore plates** — `lore/<slug>.webp`. Every lore plate is optional; missing art
  renders an engraved cartouche instead. Slugs and generation prompts are in
  `docs/lore-image-prompts.md`.

Optional `.mp4` loops go in `static/media/`. Path resolution is cached per
process — restart to pick up new files.

---

## Deployment

The `Procfile` runs gunicorn:

```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

The app holds no mutable global state, so it is safe to run multi-worker.

**Read [`docs/pre-deployment-checklist.md`](docs/pre-deployment-checklist.md)
before deploying.** It is a verified audit of what is and isn't production-ready.

One blocker is still open: **no card artwork ships**, so a deploy from this repo
is unillustrated. That needs an asset strategy rather than a patch — the options
are laid out in the checklist. Everything else on the critical path is done.

Worth doing before real traffic, none of them blocking: gunicorn is on bare
defaults (one sync worker, no access log), the Python version isn't pinned, and
there's no rate limiting on `/api/reading`.

Dependencies are pinned to an audited-clean floor; re-check with
`pip-audit -r requirements.txt` before each release.

## Further reading

- [`CLAUDE.md`](CLAUDE.md) — architecture and data model, in depth.
- [`DESIGN.md`](DESIGN.md) — the design system: tokens, type, colour, motion.
- [`docs/`](docs/) — the pre-deployment checklist, a visual consistency audit,
  the homepage hero style guide, and the lore image prompts.
