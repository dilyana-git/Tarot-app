# Arcana — Whole-App Visual Consistency Audit

**Date:** 2026-06-06
**Branch:** `claude/tarot-app-project-dSzbt`
**Scope:** Production-default surfaces (home `/`, `/cards`, `/card/<id>`, `/reading`) and the tokens / CSS / JS that drive them.
**Type:** Audit only. **Nothing in the app was changed.** This document is a decision aid — every finding includes evidence (`file:line`), why it matters, and a fix sketch with effort/risk so you can choose what to act on.

---

## 0. The one-sentence truth

The app is in better shape than a glance suggests — it already has a real two-layer token system and a near-consistent display typeface (Cinzel for every live title). The inconsistency is concentrated in three places:

1. **A half-retired "previous design"** that still ships, both as routable `?hero=` variants and as dead CSS inside `style.css`.
2. **Suit colours that live as raw hex** scattered across templates and JS, while purpose-built colour tokens (`--lapis`, `--oxblood`, `--verdigris`) sit completely unused.
3. **Per-surface one-off components and buttons** that never adopted the shared primitives, plus **three competing local variable namespaces** (`--gold-*`, raw `.arcana` hex, `--ah-*`).

---

## 1. File taxonomy — what actually ships

| File | Status | Notes |
|---|---|---|
| `static/css/tokens.css` | **Live (global)** | Canonical primitives. Loaded first in `base.html:10`. |
| `static/css/style.css` | **Live (global)** | 2,707 lines. Powers `/cards`, `/card/<id>`, `/reading`, nav, footer. Also defines a semantic alias layer (`:root`, lines 16–51) and carries a large dead layer (see F8). |
| `static/js/main.js` | **Live (global)** | Starfield, motes, nav. |
| `static/css/arcana-hero.css` | **Live (home)** | 781 lines. Loaded by `index.html:9`. Own `--ah-*` variable namespace. |
| `static/css/arcana-card.css` | **Live (home)** | 385 lines. Loaded by `index.html:10`. Own `.arcana` raw-hex variable block (lines 2–5). |
| `static/js/arcana-card.js` | **Live (home)** | 1,018 lines. Procedural SVG **illustration** engine (paints The Fool / Magician / World by hand). |
| `static/js/arcana-hero-mosaic.js` | **Live (home)** | 251 lines. Mosaic tiling widget. |
| `index.html`, `cards.html`, `card_detail.html`, `reading.html` | **Live** | The four shipped pages. |
| `index_cardfirst.html` + `arcana-hero-cardfirst.{css,js}` | **Routable experiment** | Reachable at `/?hero=cardfirst` (`app.py:94–98`). A *different* design. |
| `index_editorial.html` + `arcana-hero-editorial.{css,js}` | **Routable experiment** | Reachable at `/?hero=editorial`. A *different* design. |
| `arcana_card.html` + `/arcana-card` route | **Routable standalone** | `app.py:263–265`. Standalone widget demo page. |
| `static/css/arcana-hero-intro.{css,js}` | **Orphaned** | Referenced by no live or experimental template. |
| `static/js/arcana-hero.js` | **Orphaned** | `arcana-hero.css` *is* loaded, but `index.html` loads `arcana-hero-mosaic.js`, not this. CSS live, matching JS dead. |
| `templates/_arcana_hero.html` | **Likely orphaned** | Partial; not included by any live template. |

---

## 2. Findings (prioritized)

Severity:
**P1** = visible cross-page drift a user could notice ·
**P2** = structural / maintainability divergence ·
**P3** = cleanup / hygiene.

### P1 — visible drift

#### F1. Suit colours: tokens defined-but-unused; raw hex drifts across files
The palette intends a suit-colour system — `tokens.css:24–26` defines `--lapis #34508C`, `--oxblood #7C262B`, `--verdigris #357D6E` — but **nothing references them.** Instead each surface invents its own raw hex, and they don't even agree with each other:

| Suit | `cards.html` tile | `cards.html` JS `SUIT_META` | Agree? |
|---|---|---|---|
| Major | `var(--gold-300)` (`:13`) | `#c4933a` (`:159`, `:378`) | ✗ `#c4933a` ≠ `--gold-300` (#C8A24C) |
| Wands | `var(--gold-400)` (`:20`) | `#b07820` (`:330`) | ✗ mismatch |
| Cups | `#5d8aa8` (`:28`) | `#5d8aa8` (`:331`) | ✓ each other, but raw hex ≠ `--lapis` |
| Swords | `#a89968` (`:36`) | `#a89968` (`:332`) | raw hex, matches no token |
| Pentacles | `#5a8060` (`:45`) | `#5a8060` (`:333`) | raw hex ≠ `--verdigris` |

**Why it matters:** the suit accent is the one piece of colour that's supposed to differ per suit and stay constant per suit. Today it changes depending on which file rendered it.
**Fix sketch:** promote a suit ramp into `tokens.css` (`--suit-wands/cups/swords/pentacles/major`), decide whether the muted in-use hexes or the saturated jewel tones are canonical, and point templates + JS at the tokens. Low risk.

#### F2. The homepage card widget is lit by a different gold and ivory than the rest of the app
`arcana-card.css:2–3` opens a local `.arcana { --gold:#d7b45a; --gold-bright:#f4e2a8; --text:#ece3cb; ... }` block with **raw hex that doesn't match the tokens**: `--gold #d7b45a` vs `--gold-300 #C8A24C`; `--text #ece3cb` vs `--parchment #E8DFC8`. Because this scope drives the home hero card, the most prominent element on the site uses an off-palette gold/ivory.
**Why it matters:** the hero is the brand's first impression and it's the one place that's off-token.
**Fix sketch:** rebind `.arcana`'s locals to the tokens (`--gold: var(--gold-300)` etc.) the same way `style.css:16–51` does. Low risk, but re-check the artwork still reads well.

#### F3. Routable `?hero=` variants ship a second, different design
`app.py:94–98` maps `/?hero=cardfirst` and `/?hero=editorial` to whole alternate homepages that use a *different* type palette (Almendra Display + Cormorant Garamond) and *different* components (`.feature-card`, `.suit-name`, `.section-title`). Anyone — including a crawler or a shared link — can land on a different brand than the default.
**Why it matters:** two live designs is the definition of an inconsistent app, and it forces `style.css` to carry both eras' CSS (see F8).
**Fix sketch:** decide the variants' fate — gate behind an env flag, move to a non-routable `/dev` namespace, or remove. Low risk; high clarity payoff.

### P2 — structural divergence

#### F4. Typography: no font-family tokens; body/meta fonts mixed; the type scale is unused
- **Titles are actually consistent** on the live pages — `.page-arch-title` (`style.css:1046`), `.card-detail-title` (`:1259`), `.reading-left-title` (`:1509`) all use **Cinzel**. Good.
- **Body/meta text is not.** Card names and meta use `Cormorant SC`, `Cormorant Garamond`, `IM Fell English`, and `EB Garamond` somewhat interchangeably (e.g. `.panel-card-name` Cormorant Garamond `:2045` vs `.sc-name` Cormorant SC `:1911` vs body IM Fell English `:56`).
- **There are no `--font-display/body/mono` tokens** in `tokens.css`. Font families are hardcoded inline ~100× in `style.css`. Ironically, font-family tokens *do* exist — but only locally, as `--display` / `--body` inside `arcana-card.css:4–5`.
- **The type-scale tokens are dead on arrival.** `tokens.css:29–35` defines `--step--1 … --step-display`, but the CSS uses ~100 raw `rem` sizes instead (`.42rem`, `.49rem`, `.57rem`, `.82rem`, `1.3rem`, …). Only one or two `var(--step-*)` references exist.
**Fix sketch:** add `--font-display: 'Cinzel'`, `--font-body`, `--font-mono`, `--font-script` to `tokens.css`; map the inline declarations to them; adopt `--step-*` for the raw sizes. Medium effort, mechanical.

#### F5. Button / control vocabulary: a base system exists, but the hero and six controls bypass it
There **is** a base button system: `.btn` (`:192`), `.btn-primary` (`:211`), `.btn-outline` (`:224`), `.btn-large/.btn-sm` (`:236–237`). `reading.html` uses it correctly. But:
- The home hero invents `.btn-ghost` (defined **only** at `arcana-hero.css:312`) for its secondary CTA, where every other page's secondary button is `.btn-outline`. It also re-skins `.btn-primary` scoped to `.arcana-hero .cta-row` (`arcana-hero.css:254`).
- Six further controls are styled from scratch and don't extend `.btn`: `.filter-btn` (`:1080`), `.card-nav-btn` (`:1409`), `.tab-btn` (`:1439`), `.spread-option` (`:1762`), `.st-meta-cta` (`:2518`), `.suit-tile`.
**Fix sketch:** rename `.btn-ghost`→`.btn-outline` (or alias it), and decide which of the six are genuinely distinct components vs. just a `.btn` variant. Medium risk (touches hover/focus states — re-test).

#### F6. The "card" is reimplemented five times
Five independent card renderers, each with its own number placement, suit glyph, and corner flourishes: `.card-tile` (grid, `style.css` ~`:1150`), `.st-arc-card` (arc, built in `cards.html` JS), `.card-large` (detail, `card_detail.html`), `.spread-card` + `.panel-card` (reading), and the mosaic widget (home).
**Why it matters:** any change to "how a card looks" must be made in five places; they drift.
**Fix sketch:** a shared card primitive is the right long-term move but is the largest change here — better as post-launch v2.

#### F7. Suit glyphs are inconsistent and two of them collide
- The `/cards` suit tiles use **SVG sigils** (`cards.html:13–53`), while the grid, detail, and reading panel use **Unicode** `△ ▽ ✕ ⊕` (`cards.html:122`, `card_detail.html:46`, `reading.html:213`).
- In the SVG tiles, **Wands and Swords are both an upward triangle** (Swords just adds a crossbar) and **Cups and Pentacles are both downward** — low discriminability at a glance.
**Fix sketch:** pick one glyph set (SVG or Unicode) and one shape per suit; expose as a small partial/JS map. Low–medium effort.

### P3 — cleanup / hygiene

#### F8. Large dead / legacy CSS layer in `style.css`
`.section-title` (`:254`), `.hero-title` (`:324`), `.hero-info-name` (`:355`), `.cta-title` (`:964`), `.page-title` (`:991`), `.feature-title` (`:866`), `.suit-name` (`:920`) and their surrounding blocks are used **only** by the experimental `?hero=` templates — and `.hero-title` / `.page-title` appear in **no** template at all. This is a previous homepage's styling still resident in the global stylesheet (and the source of the Almendra Display / Cormorant Garamond "extra fonts").
**Fix sketch:** once F3 is decided, delete the blocks the live app doesn't use. Low risk if variants are retired.

#### F9. Orphaned files
`static/css/arcana-hero-intro.css`, `static/js/arcana-hero-intro.js`, `static/js/arcana-hero.js` (CSS sibling is loaded, JS isn't), and `templates/_arcana_hero.html` are referenced by nothing live. Safe to remove.

#### F10. Commented-out dead markup
`cards.html:89–102` (showcase strip) and `card_detail.html:101–109` (meta badges) are commented-out blocks left in the templates.

#### F11. The one green token is bypassed
`--sage #4a6a50` exists (`style.css:32`) for the "reversed" state, but reversed labels use raw `#80a880` (`style.css:1912`, `:2048`) and `.meaning-reversed` uses `rgba(60,80,60,.05)` (`:1460`) — three different greens for one concept.

#### F12. Repeated hardcoded background hex
`#08070f`, `#11101c`, `#161A26` appear as raw literals across `style.css:57`, `arcana-card.css:7`, and `arcana-card.js:204` (`BLEED_BG`) and in `var(--card-color, #161A26)` fallbacks. Candidates for a `--bg-deep` token.

#### F13. Stale documentation
`CLAUDE.md` describes `style.css` as "a single ~1300-line file." It is now **2,707 lines**. Worth refreshing once the dead layer (F8) is removed.

---

## 3. Prioritized fix list (mapped to risk)

### Tier A — low risk, high payoff, safe before launch
1. **Promote tokens** — add suit-colour and font-family tokens to `tokens.css`; repoint existing raw hex/inline fonts at them. *(F1, F4, partial F2)*
2. **Decide the `?hero=` variants' fate** — flag, relocate, or remove the routes so only one design ships. *(F3)*
3. **Delete dead code** — orphaned files (F9), commented markup (F10), and (after step 2) the legacy CSS layer (F8).
4. **Quick colour fixes** — reconcile the Wands suit mismatch (F1) and the three greens (F11).

### Tier B — medium effort / more test surface
5. **Button primitive** — fold `.btn-ghost` into the shared system and audit the six bespoke controls. *(F5)*
6. **Adopt the type scale** — migrate ~100 raw `rem` sizes to `--step-*`. *(F4)*
7. **Rebind `arcana-card.css` `.arcana` locals** to tokens so the hero matches the app. *(F2)*

### Tier C — post-launch v2
8. **Unify the card component** — one primitive behind the five renderers. *(F6)*
9. **Single suit-glyph set** with discriminable Wands/Swords. *(F7)*

---

## 4. What I deliberately did **not** flag

- **Artwork fills in `arcana-card.js`** (dozens of raw hex like `#f6e4b0`, `#0c1736`) are *illustration*, not UI theming — you don't tokenize the pixels of a painting. (One soft note: the artwork's gold `#f4e2a8`/`#cda14e` is its own gold, distinct from the UI ramp — acceptable for art, but it's why the hero reads slightly warmer.)
- **Nothing was modified.** No tokens added, no files deleted, no CSS rewritten.

---

*Next step is yours: tell me which tier (or which individual findings) you want to act on, and I'll brainstorm/spec that specific change before any code is written.*
