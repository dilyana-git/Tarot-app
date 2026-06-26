# DESIGN.md

Design guidance for **Arcana** — the tarot oracle web app. This file is the
reference for any visual/UI work (by Claude or anyone else). It complements
`CLAUDE.md`, which covers architecture and routes; this file covers the *look*.

The guiding rule: **the design tokens are the single source of truth.** Reach
for an existing token before inventing a value. New colours, fonts, spacing, or
radii almost always mean a token is missing — add it to the token layer, don't
hard-code it in a component.

---

## Aesthetic

A candlelit, occult-editorial feel: near-black midnight grounds, an antique
**gold** ramp for ink and rules, jewel accents used sparingly, and serif
typography with wide letter-spacing on labels. Decoration is restrained and
atmospheric — a fixed grain overlay, a starfield canvas, and faint ✦ sparkles —
never loud. Layouts are quiet and architectural: thin gold rules, generous
negative space, small-caps labels, centered "page-arch" headers.

Think *illuminated manuscript meets modern editorial*, not neon mysticism.

---

## Token layers (load order matters)

Two `:root` blocks, loaded in this order from `base.html`:

1. **`static/css/tokens.css`** — the canonical design tokens (palette, fonts,
   type scale, spacing, tracking). Loaded **first**. This is the source of truth.
2. **`static/css/style.css`** `:root` — a thin *semantic rebind* layer that maps
   tokens onto role names (`--bg`, `--text`, `--rule`, `--shadow`, `--radius`,
   `--transition`) plus a few legacy aliases. Components reference these roles.

When adding a token: put the raw value in `tokens.css`; if it needs a semantic
role, alias it in the `style.css` rebind. Never skip straight to a literal in a
component rule.

---

## Palette

### Grounds (near-black, indigo undertone)
| Token | Value | Use |
|---|---|---|
| `--ink-900` → `--bg` | `#0A0B11` | page ground (also `theme-color`) |
| `--ink-800` → `--bg2` | `#0F1118` | raised panels |
| `--ink-700` → `--bg3` | `#161A26` | highest surfaces |
| `--surface` / `--surface2` | ink + gold mix | card/tile fills on hover |

The `<body>` ground is a radial gradient over these, not a flat fill.

### Gold ramp (primary "ink")
`--gold-100` `#F6E7B2` → `--gold-200` `#E7C878` → `--gold-300` `#C8A24C`
→ `--gold-400` `#9A7B36` → `--gold-500` `#6E5527` → `--gold-600` `#4A3A1C`.

Semantic aliases: `--gold` (=300, the workhorse), `--gold-lt` (link), `--gold-pale`
(link hover), `--gold-warm`, `--gold-dim`. Hairline rules are gold at low alpha:
`--rule` (16%) and `--rule-hover` (42%).

### Text (parchment)
`--parchment` `#E8DFC8` → `--text`; `--parchment-dim` `#B9B299` → `--text-dim`.

### Jewel accents (sparingly)
`--lapis` `#34508C`, `--oxblood` `#7C262B`, `--verdigris` `#357D6E`.

### Upright vs reversed duality
The app's upright/reversed meaning is expressed as **gold vs verdigris**. Use the
canonical `--reversed*` family — never improvise greens:
`--reversed` (base), `--reversed-pale` (labels on dark), `--reversed-tint` (fills),
`--reversed-line` (borders).

### Suit accents (canonical — consumed by `.suit-tile` and `cards.js`)
| Suit | Token | Element |
|---|---|---|
| Major | `--suit-major` `#C8A24C` | — (gold) |
| Wands | `--suit-wands` `#9A7B36` | Fire |
| Cups | `--suit-cups` `#5D8AA8` | Water |
| Swords | `--suit-swords` `#A89968` | Air |
| Pentacles | `--suit-pentacles` `#5A8060` | Earth |

JS reads these from `getComputedStyle(:root)` (see `cards.html`), so the arc/JS can
never drift from the tiles. **Set suit colour only here.**

---

## Typography

Four font roles (Google Fonts, loaded in `base.html`):

| Role | Token | Family | Use |
|---|---|---|---|
| Display | `--font-display` | **Cinzel** | titles, eyebrows, labels, nav |
| Body | `--font-body` | **EB Garamond** | body copy, descriptions |
| Accent | `--font-accent` | **Cormorant Garamond** | card names, small-caps labels |
| Mono | `--font-mono` | **JetBrains Mono** | technical meta (numbers, ranges) |

**Type scale** (perfect-fourth): `--step--1` `0.8rem` … `--step-4` `2.441rem`, plus
`--step-display` `clamp(3.5rem, 8vw, 7rem)` for hero titles. Use scale steps, not
arbitrary `rem`s.

**Tracking:** labels/eyebrows use `--track-label` `0.2em` and are typically
uppercase small-caps; display text uses `--track-display` `0.01em`. Body
`line-height` is `1.75`.

---

## Spacing, radius, shadow, motion

- **Spacing** (8px base): `--space-1` `0.5rem` → `--space-7` `6rem`. Prefer these
  over raw values for padding/margins/gaps.
- **Radius:** `--radius` `4px`, `--radius-md` `6px`, `--radius-lg` `10px`. The UI
  is intentionally low-rounding — corners are crisp.
- **Shadow:** `--shadow-sm` / `--shadow` / `--shadow-lg` — soft, very dark,
  large-spread (e.g. `0 20px 70px rgba(0,0,0,.78)`). Shadows are for depth on a
  dark ground, not drop-shadow flourishes.
- **Motion:** one shared easing token, `--transition` `0.28s ease`. Keep
  transitions subtle. **Always** honour `prefers-reduced-motion` — existing
  animations (deck float, shuffle, entrance observers) already gate on it; new
  ones must too.

---

## Components & conventions

- **Page header** — the centered "architectural" header pattern: a small-caps
  **eyebrow** (`.page-arch-eyebrow` with `.page-arch-rule` hairlines flanking a
  `.page-arch-label`) above a `.page-arch-title`. Reuse this rather than ad-hoc
  headings. See `reading.html` (eyebrows) and the error pages (titles).
- **Buttons** — `.btn-primary` (gold fill, dark text), `.btn-ghost` /
  `.btn-outline` (gold hairline, transparent). Uppercase, display font, tracked.
- **Cards grid / tiles** — `.card-tile` with `--card-color` / `--accent-color`
  passed inline per card; hover lifts to `--surface`.
- **Suit tiles** (`/cards`) — sigil icon + element + count. Suit colour comes from
  the `--suit-*` tokens via `--tile-accent`. (Name labels were intentionally
  dropped; tiles read by sigil + element.)
- **Hairline rules** — thin gold dividers (`--rule`) are a core motif: section
  separators, dashed arc/ecliptic lines, eyebrow flanks. Lean on them for
  structure instead of boxes/fills.
- **Decorative glyph** — ✦ is the house sparkle/star, used in backgrounds,
  corners, and bullets.

### CSS file map
| File | Scope |
|---|---|
| `tokens.css` | design tokens (source of truth) |
| `style.css` | sitewide: rebind layer, navbar, grid, card detail, reading-board geometries, sections |
| `arcana-card.css` | the homepage mosaic card widget |
| `arcana-hero.css` | homepage hero, scoped under `.arcana-hero` |

Per-page `{% block head %}` may add scoped overrides (see `index.html`), but keep
overrides minimal and prefer fixing the shared sheet/token.

---

## Rules of thumb for design changes

1. **Token first.** No raw hex, font names, or magic spacing in components — use
   or add a token.
2. **Set suit/colour facts once.** Suit colours live in `--suit-*`; JS reads them.
   Don't duplicate a colour in JS and CSS.
3. **Respect the load order.** Raw value → `tokens.css`; semantic role →
   `style.css` rebind; consumption → component sheet.
4. **Stay quiet.** Favour hairline rules, negative space, and small-caps labels
   over heavy fills, borders, and bright colour.
5. **Accessibility holds.** Maintain contrast on the dark ground, keep focus
   states, and gate motion behind `prefers-reduced-motion`.
6. **Scope new CSS** to the right sheet; use the page `head` block only for
   genuinely page-local overrides.
