# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
pip install -r requirements.txt   # Flask 3.0.3, Werkzeug 3.0.3, gunicorn
python app.py                     # runs on http://localhost:5000 (set FLASK_DEBUG=true for debug)
```

## Tests

```bash
pip install -r requirements-dev.txt   # adds pytest
pytest                                 # smoke suite in tests/
```

`tests/test_smoke.py` covers route status, the JSON API shapes (`/api/cards`,
`/api/reading`), the 404 handler, narrative-composer determinism, and the
image-path placeholder fallback. There is no linter configured.

## Architecture

**Flask backend (`app.py`)** serves five pages and two JSON API endpoints:

| Route | Template | Notes |
|---|---|---|
| `GET /` | `index.html` | Builds `major_arcana` list with resolved `image_url` and `video_url`. Under `debug` only, `?hero=cardfirst\|editorial` serves dev-only variant templates (production always serves `index.html`) |
| `GET /cards` | `cards.html` | Accepts `?filter=major\|minor\|all` and `?suit=Wands\|Cups\|Swords\|Pentacles` |
| `GET /card/<int:id>` | `card_detail.html` | Prev/next navigation links |
| `GET /reading` | `reading.html` | Passes the `SPREADS` dict |
| `GET /lore` | `lore.html` | The history & symbolism read; passes the structures from `data/lore_data.py` |
| `POST /api/reading` | — | Draws N random cards for the chosen spread; returns JSON (each card carries its position `name` and `meaning`) |
| `GET /api/cards` | — | Returns all 78 cards as JSON (public fields only via `_card_json`) |
| `GET /health` | — | Returns `{"status":"ok"}` for load-balancer probes |

**Card data (`data/tarot_data.py`)** is a static Python file — the single source of truth for all 78 cards. Each card dict has: `id`, `name`, `number`, `arcana` (`'major'`/`'minor'`), `suit` (None for major), `symbol`, `element`, `keywords_upright`, `keywords_reversed`, `upright_meaning`, `reversed_meaning`, `description`, `card_color`, `accent_color`, `image` (path relative to `static/images/`), and optionally `video` (filename relative to `static/media/`). `ALL_CARDS = MAJOR_ARCANA + MINOR_ARCANA`. Card IDs for minor arcana start at 22.

**Spreads (`data/tarot_data.py:SPREADS`)** map each spread key to `{name, description, positions}`, where `positions` is an *ordered* list of `{name, meaning}` dicts. The order is load-bearing: `api_reading` pairs `positions[i]` with the i-th drawn card, and the reading CSS maps each card to a board cell by its nth-child index.

**Image resolution (`app.py:get_card_image_path`)** tries multiple extensions in order (`.jpg`, `.jpeg`, `.png`, `.webp`) and falls back to `images/card-placeholder.svg` if none exist. Image paths on disk follow these conventions:
- Major arcana: `static/images/major/<slug>.jpg` — slug is the lowercased name with `the_` prefix stripped and spaces replaced with `_` (e.g. `high_priestess.jpg`)
- Minor arcana: `static/images/minor/<suit_lower>/<rank>.jpg` — rank is mapped via `MINOR_RANK_MAP` (e.g. `ace`, `two`, `page`, `king`)

**Card art assets** (`static/images/`, `static/media/`) are gitignored because of their size. On a fresh clone every card renders with `images/card-placeholder.svg` instead. To add real artwork, place files matching the conventions above under `static/images/major/` and `static/images/minor/<suit>/`, then optionally add `.mp4` loops under `static/media/`. The LRU-cached resolver picks them up automatically on the next request (restart to clear the cache).

**Lore content (`data/lore_data.py`)** is the single source of truth for `/lore`: `LORE_INTRO`, `CHAPTERS` (drives the sticky rail and its scroll-spy — each `id` must match a `<section id>`), `HISTORY_TIMELINE`, `DECK_STRUCTURE`, `SUITS`, `NUMEROLOGY` (`pips` + `courts`, rendered as an interactive ladder), `SYMBOLS`, `READING_ETHOS`. Most entries carry an `image` slot built by `_img(slug, alt, caption)`; `app.py:lore_image_url` resolves `static/images/lore/<slug>.<ext>` (same extension order as the card art) and returns `''` when the art doesn't exist, in which case `lore.html`'s `plate()` macro renders an engraved cartouche. **Every lore plate is optional** — the page must stay complete with no lore art on disk. Generation prompts, one per slug, live in `docs/lore-image-prompts.md`; keep the slugs there in sync with `lore_data.py`.

**Templates** all extend `base.html`, which provides the navbar and starfield canvas, loads `static/css/tokens.css` + `static/css/style.css` in `<head>`, and loads `static/js/main.js` at the bottom. Per-page scripts go in `{% block scripts %}` *before* `main.js` executes. The homepage injects card data as `window.ARCANA = {{ major_arcana | tojson }}`, consumed by the mosaic hero controller (`arcana-hero-mosaic.js`).

**Frontend.** `static/js/main.js` is sitewide vanilla JS: an `initStars` canvas starfield plus the mobile-nav toggle, in-page smooth-scroll, and a card-tile `IntersectionObserver` entrance animation. The **homepage hero is a self-contained mosaic card widget**: `static/js/arcana-card.js` exposes `window.ArcanaCards.mount(el, opts)` — a framework-free interactive card that paints the art as a `<canvas>` mosaic of tesserae (idle twinkle, hover-tilt, click-to-flip, and an opacity cross-fade on prev/next). `static/js/arcana-hero-mosaic.js` mounts it into `#heroMosaicMount` and drives the surrounding hero UI (text column, progress counter, nav buttons) from the widget's `onCard` callback. `static/js/lore.js` drives `/lore`: scroll-reveal, hero parallax, the chapter-rail scroll-spy, two roving-tabindex pickers (numerology ladder, symbol grid) and the plate lightbox — it also sets `.lore-js` on `<html>`, which is what arms the reveal CSS, so a script failure leaves the page fully visible rather than blank. `static/js/reading.js` runs the reading page's staged flow: choose spread → set intention → shuffle → deal face-down → tap a card to reveal → tap a revealed card for its detail panel.

**Styling** is split across `static/css/`: `tokens.css` holds the design tokens (CSS custom properties — colours, suit accents, etc.) that the other sheets reference as the single source of truth; `style.css` is the large sitewide stylesheet (navbar, cards grid, card detail, reading-board geometries, features/suits sections); `arcana-card.css` styles the mosaic card widget; `arcana-hero.css` lays out the homepage hero, scoped under `.arcana-hero`; `lore.css` holds everything for `/lore` (loaded from that template's `{% block head %}` — nothing lore-specific belongs in `style.css`). The reading spread geometries (`.spread-single` / `-three-card` / `-five-card` / `-horseshoe` / `-celtic-cross` in `style.css`) map each card to a board cell by nth-child, mirroring the `SPREADS[...].positions` order.
