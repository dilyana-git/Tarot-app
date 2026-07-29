# Arcana — Pre-Deployment Analysis

**Date:** 2026-07-29
**Branch:** `claude/pre-deployment-analysis-0bv2zn` (at `c76cd74`)
**Scope:** everything that ships — `app.py`, `data/`, `templates/`, `static/`, packaging, deps.
**Type:** Analysis only. No application code was changed by this document.

Every finding below was verified against the running app, not inferred from reading.
Where a fix was tested, the verification command and its result are recorded.

---

## Verdict

The application code is in good shape. Routes are stable, input handling is safe,
the 32-test suite passes, error handlers work, and there are no debug leftovers or
hardcoded hosts. What is *not* ready is the **supply chain and the deploy artifact**:
all three production dependencies carry known CVEs, and the repository ships no card
artwork or even the placeholder it falls back to.

Three of the four blockers have since been cleared (B1, B3, B4). **The one that remains is
B2 — no card artwork ships.** It is the only item on this page that needs a decision rather
than a patch.

---

## P0 — Blockers

### B1. All three production dependencies have known vulnerabilities — ✅ FIXED 2026-07-29

`pip-audit -r requirements.txt` reported **8 known vulnerabilities across 3 of 3 packages**:

| Package | Was | Advisories | Now |
|---|---|---|---|
| `flask` | 3.0.3 | PYSEC-2026-2151 | **3.1.3** |
| `werkzeug` | 3.0.3 | PYSEC-2026-2044/2045/2046/2320, PYSEC-2026-3417 | **3.1.8** |
| `gunicorn` | 21.2.0 | PYSEC-2026-1433, PYSEC-2026-1434 | **26.0.0** |

The gunicorn advisories are request-smuggling class — they mattered specifically because
gunicorn is the public-facing process in `Procfile`.

`requirements-dev.txt` was bumped in the same pass: `pytest` 8.2.0 → **9.0.3**
(PYSEC-2026-1845). Dev-only, so it never reached production, but it is free to fix.

**Verification.** No source changes were required — it is a pure pin bump. Checked in a
throwaway venv built from `requirements.txt` alone, so the result does not depend on
system packages:

```
pip install -r requirements.txt   -> clean resolve, no conflicts
pytest                            -> 33 passed
pip-audit (full resolved tree)    -> no vulns in any declared dependency
gunicorn app:app --workers 2      -> all 8 routes 200/404 as expected, logs clean
```

Because pytest never exercises the WSGI server, the gunicorn jump (21 → 26, five majors)
was verified by actually serving the app: every route, a 10-card Celtic Cross draw with
narratives intact, the 413 body cap still enforced, and the security headers still applied.
Gunicorn's defaults are unchanged across those majors (still 1 sync worker / 30 s timeout),
so **F4 below still stands**. The new floor is Python 3.10; this environment runs 3.11.15.

**One residual, not fixable here.** `setuptools` 79.0.1 carries PYSEC-2026-3447 (fixed in
83.0.0). It is not declared in either requirements file — it is bundled by `venv`/`pip` —
and the app never imports it or `pkg_resources`, so it is a build-time artifact rather than
a runtime dependency. Pinning it in `requirements.txt` would misrepresent it. Handle it by
upgrading `setuptools` in the deploy image or base environment.

### B2. No card artwork ships with the repository

`.gitignore` excluded `static/images/` wholesale, and `git ls-files static`
confirms **nothing** under either path is tracked. Deploying this repo as-is produces a site
where all 78 cards, the homepage hero mosaic, and every lore plate render with no art.

The code degrades correctly (`get_card_image_path` falls back, `lore_image_url` returns `''`,
templates guard on it) — so this is not a crash, it is a blank product.

A deployment needs an explicit asset strategy. Options, roughly in order of effort:

1. **Track the optimized WebP in git.** The resolver already prefers `.webp` first
   (`app.py:72`) precisely because it is ~7× smaller. If the full set fits in a sane repo
   size, un-ignoring `static/images/` is the simplest thing that works.
2. **Object storage / CDN.** Serve art from S3/R2/Cloudinary and have the resolver emit
   absolute URLs. Best for cache headers and origin load; most code churn.
3. **Build-step fetch.** Pull assets from a release artifact during deploy. Keeps the repo
   small but adds a deploy dependency that can fail.

This decision is a prerequisite for B3 and for F3 (cache headers) below.

### B3. The placeholder SVG the fallback points at does not exist — ✅ FIXED 2026-07-29

`get_card_image_path` returns `'images/card-placeholder.svg'` when no art is found, and
`CLAUDE.md` documents this as the fresh-clone behaviour. But that file was inside the
gitignored `static/images/` tree and was not in the repo:

```
git ls-files | grep -i placeholder        ->  (no output)
GET /static/images/card-placeholder.svg   ->  404
```

`cards.html:93-94` guarded against the placeholder path and skipped the `<img>`, but
`card_detail.html` emitted it unconditionally — a **404 on every card detail page**, masked
at runtime by an `onerror` handler that hid the element.

Both halves were fixed, and they had to land together:

- **The asset.** `static/images/card-placeholder.svg` is now committed — a 2:3 plate in the
  token palette. The ignore rule became `static/images/*` plus a negation, because git will
  not descend into an ignored *directory*, so a negation under the old `static/images/`
  pattern would have silently done nothing. Verified: only the placeholder stages, and
  `major/`, `lore/` etc. stay ignored.
- **The guard.** `card_detail.html` now skips the `<img>` on the placeholder, matching
  `cards.html`.

The guard is not cosmetic. `card_detail.html`'s script adds `.has-image` once the image
loads, and that CSS hides the card's typographic face (`style.css:613-615`). Committing the
asset *without* the guard would therefore have replaced every card's own face with one
generic plate — the fix would have caused a regression on its own.

The SVG draws its sparkles as paths rather than `✦` glyphs: an SVG loaded through `<img>` is
isolated from the page's fonts, so a literal U+2726 renders as tofu wherever the system font
lacks it. (Caught by rasterising the file and looking at it.)

### B4. Missing `SECRET_KEY` degrades silently instead of failing — ✅ FIXED 2026-07-29

The app warned and then booted with `'dev-only-insecure-key'`. A `warnings.warn` is invisible
in most production log pipelines, so a misconfigured deploy came up looking healthy —
`/health` returning `ok` — while signing sessions with a key published in `app.py`.

Fixed by splitting the two cases on **how the module is loaded**, which is what actually
distinguishes dev from deployment:

- **Run as a script** (`python app.py`) — the local dev path. Unchanged: warn and continue,
  so the documented quickstart still works with no setup.
- **Imported** — what a real server does; gunicorn imports `app:app`. Raises `RuntimeError`
  at import unless `FLASK_DEBUG=true`.

`__name__` is the discriminator: it is `'__main__'` under `python app.py` and `'app'` under
gunicorn. Verified against the real server rather than the test client:

```
gunicorn app:app                    -> RuntimeError, "Worker failed to boot", exit 3
SECRET_KEY=… gunicorn app:app       -> serves normally
python app.py  (no SECRET_KEY)      -> warns, /health 200 — quickstart preserved
```

Tests import the module, so `conftest.py` now sets a throwaway `SECRET_KEY` via
`setdefault`. The three startup paths are covered by tests that import `app.py` in a fresh
subprocess, since the failure happens at import and cannot be exercised in-process.

---

## P1 — Should fix before serving public traffic

### F1. No request body size limit — ✅ FIXED 2026-07-29

`MAX_CONTENT_LENGTH` was unset, so Werkzeug buffered whatever a client sent.
Verified before the fix: a 5 MB POST body to `/api/reading` returned `200`.

Fixed in `app.py` — a 64 KB cap plus a 413 handler that returns JSON on `/api/*`, matching
the existing 404/500 branching. The endpoint truncates `question` to 500 chars anyway, so
nothing legitimate comes near the ceiling. Covered by
`test_api_reading_oversized_body_413`; oversized bodies now get
`413 {"error": "Request too large"}`.

### F2. `/api/reading` has no rate limiting

Each call does a `random.sample` plus full narrative composition through
`data/reading_composer.py` (640 lines) and returns ~10 KB of JSON. Combined with F1 and a
single gunicorn worker (F4), a trivial loop saturates the app. `Flask-Limiter` with an
in-memory or Redis backend is the usual answer.

### F3. Static assets revalidate on every request

`SEND_FILE_MAX_AGE_DEFAULT` is unset, so Flask serves static files with
`Cache-Control: no-cache` plus an ETag — verified against `/static/css/style.css`. Every
asset is conditionally re-requested on every page load. This site ships ~5,700 lines of CSS
and ~2,300 lines of JS across 11 files, plus (eventually) 78 card images.

Because filenames are not content-hashed, a long `max-age` cannot be set safely today. The
durable fix is asset fingerprinting; the interim fix is a modest `max-age` on `/static/`, or
putting the assets behind a CDN as part of the B2 decision.

### F4. `Procfile` runs gunicorn on bare defaults

```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

Confirmed defaults: **1 sync worker, 30 s timeout, no access log.** One slow or hung request
blocks the entire site, and there is no request log to diagnose it with. A reasonable
starting point:

```
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 3 --threads 2 \
     --timeout 30 --graceful-timeout 30 --access-logfile - --error-logfile -
```

Tune `--workers` to the host's CPU allocation. The app holds no mutable global state
(`_static_exists` is a per-process read-only cache), so it is safe to run multi-worker.

### F5. No Python version pin

No `runtime.txt`, `.python-version`, or `Dockerfile`. The platform picks the interpreter,
which means the production Python can drift from the tested one without any signal. This
environment tested on **3.11.15**. Pin it.

### F6. No application logging configuration

Nothing configures `logging` (verified: no `getLogger`/`logging` reference in `app.py`).
Unhandled exceptions reach the 500 handler and print to stderr, but there is no structured
logging, no request correlation, and no error reporting hook. At minimum, enable gunicorn's
access log (F4) and attach an error tracker.

---

## P2 — Housekeeping

### H1. 131 KB of unrelated tooling committed at repo root — ✅ FIXED 2026-07-29

`image-slot.js` (64 KB) and `support.js` (66 KB) were scaffolding from an unrelated toolchain —
`support.js` self-identified as `GENERATED from dc-runtime/src/*.ts`, `image-slot.js` as an
"omelette starter scaffold". Neither was referenced by any template, script, or Python module
(verified by grep across the tree). Both deleted.

### H2. `CLAUDE.md` documents features that no longer exist

It describes dev-only `?hero=cardfirst|editorial` variant templates on `GET /`. There is no
such code in `app.py` and no such templates in `templates/` — the whole variant mechanism
was removed. The route table should be corrected before it misleads someone mid-incident.

### H3. `docs/consistency-audit-2026-06-06.md` is stale

Its file taxonomy lists `index_cardfirst.html`, `index_editorial.html`, `arcana_card.html`,
`templates/_arcana_hero.html`, `static/js/arcana-hero.js` and others — all since deleted. It
also cites `style.css` at 2,707 lines (now 1,952). Mark it as a historical snapshot or retire it.

### H4. No README — ✅ FIXED 2026-07-29

There was a thorough `CLAUDE.md` and a `DESIGN.md`, but nothing telling a human how to run,
configure, or deploy the app, and the deployment-relevant environment variables were
documented nowhere.

Added `README.md`: quickstart, the full env-var table (`SECRET_KEY`, `FLASK_DEBUG`,
`CORS_ORIGINS`, `PORT`), route and spread reference, project layout, the card-art
conventions, and a deployment section pointing here for the open blockers.

### H5. No `robots.txt` or `sitemap.xml`

For a public content site with 78 card pages plus `/lore`, both are worth having. `/api/*`
should be disallowed.

### H6. Open Graph image is an SVG

`base.html:16` sets `og:image` to `favicon.svg`. Most social platforms do not render SVG
previews, so shared links will show no image. A 1200×630 PNG/JPG is needed.

### H7. Google Fonts loaded from a third-party CDN

`base.html:21-23` pulls four families from `fonts.googleapis.com`. This is a render-blocking
external dependency and a third-party request on every page load — worth self-hosting, and
worth a deliberate decision if the site will serve EU visitors.

### H8. No Content-Security-Policy

`_security_headers` (`app.py:36-49`) sets `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy` and conditional HSTS — a good baseline — but no CSP. Adding one is not
free: `index.html` injects `window.ARCANA` as an inline script, so it needs a nonce or a hash.
Worth doing, but it is real work, not a header one-liner.

---

## Verified as *not* problems

These were checked and are fine — recorded so they are not re-investigated:

- **All routes healthy.** `/`, `/cards`, `/card/<id>`, `/reading`, `/lore`, `/health`,
  `/api/cards`, `/api/reading` all return 200; `/nope`, `/card/999`, `/card/-1` return 404.
- **Test suite green.** 32 passed, both on pinned and on upgraded dependencies.
- **Input handling is safe.** `?filter=bogus`, `?suit=Bogus`, `?suit=<script>` all degrade to
  a 200 with no injection. `/api/reading` does not echo the submitted question, so an XSS
  payload in it goes nowhere. Client-side rendering escapes via `esc()` in `reading.js`.
- **Error handlers work in production mode.** A forced exception with
  `PROPAGATE_EXCEPTIONS=False` renders `500.html`; `/api/*` paths correctly get JSON for both
  404 and 500.
- **CORS preflight works.** `OPTIONS /api/reading` with an allowed `Origin` returns 200 with
  the correct `Access-Control-Allow-Origin`.
- **No debug leftovers.** No `debugger`, no TODO/FIXME, no hardcoded `localhost`/`http://`
  anywhere in `app.py`, `data/`, `templates/`, or `static/`. The single `console.error` in
  `reading.js:145` is a legitimate error path.
- **Debug mode is env-gated.** `app.run(debug=...)` reads `FLASK_DEBUG`, and the `__main__`
  block is bypassed under gunicorn regardless.
- **Every referenced asset exists.** All 11 `url_for('static', …)` targets in the templates
  resolve to files on disk.
- **Health check exists** and is suitable for a load-balancer probe.

---

## Suggested order of work

1. Decide the card-art strategy **(B2)** — everything about the deploy's size and shape follows from it
2. Gunicorn worker/log flags **(F4)**
3. Pin the Python version **(F5)**
4. Fix `CLAUDE.md`'s route table **(H2)**
5. Rate limiting, cache headers, CSP, logging **(F2, F3, F6, H8)** — as traffic justifies

Items 2–4 are small and independent. Item 1 is the only one that needs a decision rather
than a patch, and it is now the last thing standing between this and a deployable build.

**Done so far:** the dependency bump **(B1)**, the placeholder asset and its guard **(B3)**,
the `SECRET_KEY` startup refusal **(B4)**, `MAX_CONTENT_LENGTH` **(F1)**, the root-level
scaffolding deletion **(H1)**, and the README **(H4)**.
