# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
pip install -r requirements.txt   # Flask 3.0.3, Werkzeug 3.0.3
python app.py                     # runs on http://localhost:5000 with debug=True
```

There are no tests and no linter configured.

## Architecture

**Flask backend (`app.py`)** serves four pages and two JSON API endpoints:

| Route | Template | Notes |
|---|---|---|
| `GET /` | `index.html` | Builds `major_arcana` list with resolved `image_url` and `video_url` |
| `GET /cards` | `cards.html` | Accepts `?filter=major\|minor\|all` and `?suit=Wands\|Cups\|Swords\|Pentacles` |
| `GET /card/<int:id>` | `card_detail.html` | Prev/next navigation links |
| `GET /reading` | `reading.html` | Passes `SPREADS` dict |
| `POST /api/reading` | — | Draws N random cards for the chosen spread; returns JSON |
| `GET /api/cards` | — | Returns all 78 cards as JSON |

**Card data (`data/tarot_data.py`)** is a static Python file — the single source of truth for all 78 cards. Each card dict has: `id`, `name`, `number`, `arcana` (`'major'`/`'minor'`), `suit` (None for major), `symbol`, `element`, `keywords_upright`, `keywords_reversed`, `upright_meaning`, `reversed_meaning`, `description`, `card_color`, `accent_color`, `image` (path relative to `static/images/`), and optionally `video` (filename relative to `static/media/`). `ALL_CARDS = MAJOR_ARCANA + MINOR_ARCANA`. Card IDs for minor arcana start at 22.

**Image resolution (`app.py:get_card_image_path`)** tries multiple extensions in order (`.jpg`, `.jpeg`, `.png`, `.webp`) and falls back to `images/card-placeholder.svg` if none exist. Image paths on disk follow these conventions:
- Major arcana: `static/images/major/<slug>.jpg` — slug is the lowercased name with `the_` prefix stripped and spaces replaced with `_` (e.g. `high_priestess.jpg`)
- Minor arcana: `static/images/minor/<suit_lower>/<rank>.jpg` — rank is mapped via `MINOR_RANK_MAP` (e.g. `ace`, `two`, `page`, `king`)

**Templates** all extend `base.html`, which provides the navbar, starfield canvas, SVG sparkle overlay, and loads `static/js/main.js` at the bottom. Per-page scripts go in `{% block scripts %}` *before* `main.js` executes. The index page injects card data as `const ARCANA = {{ major_arcana | tojson }}` for the JS carousel.

**Frontend (`static/js/main.js`)** is a single vanilla JS file with four IIFEs: `initStars` (canvas starfield), `initMotes` (hero floating particles), `initJourney` (major arcana auto-advancing carousel), and `initJourneyParticles` (particles inside the central circle). The journey carousel is driven entirely by the `ARCANA` global — it manages `.has-media` / `.has-video` CSS classes on `.journey-circle` elements to suppress decorative overlays when card images/videos are present.

**Styling (`static/css/style.css`)** is a single ~1300-line file. Key CSS custom property: `@property --card-color` (registered for animation tweening between card background colours). The hero uses a CSS Grid two-column layout (`38% / 1fr`). The three-circle journey display uses absolute positioning within `.hero-journey`. The orbit ring system (`.orbit-shell` → `.orbit-ring.or-1/2/3` → `.orbit-dot`) places rings as siblings of `.journey-circle` so they extend visually outside the card image area.
