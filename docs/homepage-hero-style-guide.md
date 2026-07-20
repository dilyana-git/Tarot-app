# Arcana — Homepage / Hero Style Guide

**Date:** 2026-06-06
**Branch:** `claude/tarot-app-project-dSzbt`
**Scope:** The default home page (`/`) — the navbar/background chrome from `base.html` and the
`arcana-hero` section (`templates/index.html`, `static/css/arcana-hero.css`,
`static/css/arcana-card.css`, `static/js/arcana-hero-mosaic.js`).
**Companion doc:** [`consistency-audit-2026-06-06.md`](consistency-audit-2026-06-06.md) — that file lists
what's *wrong* (findings F1–F13). This file documents what the homepage *is*, so new work conforms
without re-deriving the look. Where a rule here maps to an audit finding, the finding ID is cited.

> This is a **descriptive + prescriptive** guide, not a change order. Nothing in the app was modified to
> write it. The "Refinement backlog" at the end is the only place that proposes changes, each with
> effort/risk so you can choose.

---

## 0. The feeling in one sentence

A **candlelit grimoire** rendered with **architectural restraint**: near-black midnight-indigo ground,
a single disciplined gold doing all the talking, and an editorial two-column composition that treats a
tarot card like a museum artifact under a warm spotlight — reverent, precise, never kitsch.

**Three words to hold onto:** *Burnished · Quiet · Ceremonial.*

---

## 1. Voice & restraint principles

These are the load-bearing rules. Break one and the homepage stops feeling like Arcana.

1. **Gold is the only color.** On the homepage the jewel accents (`--lapis`, `--oxblood`,
   `--verdigris`) and the suit ramp do **not** appear. Hierarchy is built from *values of gold* (pale →
   burnished → dim) against near-black, never from hue. If you reach for a second color, stop.
2. **The card is the only bright thing.** Everything else — text, rules, controls — sits in the
   gold-on-near-black register. The mosaic card is the single luminous object; its glow is what lights
   the surrounding layout (`.hero-sparkles`, `.hero-drift`). Don't add competing light sources.
3. **Light, not boxes.** Depth comes from glow, inner specular, and soft shadow — not from borders,
   fills, or cards-with-rounded-corners. The hero deliberately *drops* the oval frame
   (`index.html:11–28`) so the tiled artwork stands on its own feathered edge.
4. **Editorial, not decorative.** Copy is set like a museum wall label / spec sheet: an eyebrow rule, a
   numbered title, keywords as a tracked caps line, a definition list for ELEMENT / SYMBOL. Wide
   letter-spacing and small caps do the ceremonial work; ornament is reserved to the artwork.
5. **Motion is a held breath.** Transitions are short (≤ ~0.5s), eased, and *purposeful* — a card flip,
   a text cascade, an occasional twinkle. Nothing loops aggressively; everything respects
   `prefers-reduced-motion`.

---

## 2. Color

### 2.1 The ground (near-black, indigo undertone)

| Token | Hex | Role on the homepage |
|---|---|---|
| `--ink-900` | `#0A0B11` | Deepest ground reference |
| `--ink-800` | `#0F1118` | `--ah-bg-warm` |
| `--ink-700` | `#161A26` | `--ah-bg-glow` |

The actual page background is a body-level radial gradient (`style.css:57`):
`radial-gradient(120% 80% at 50% 12%, #11101c 0%, #08070f 45%, #050409 100%)` — a candle-lit pool that's
warmest top-center (behind the navbar/title) and falls to near-pure-black at the edges. The hero sets
**no** background of its own; it inherits this on purpose (`arcana-hero.css:57`).
*(Drift note — audit F12: those three literals `#11101c / #08070f / #050409` are raw hex, not `--ink-*`
tokens. See backlog item R5.)*

### 2.2 The gold ramp

| Token | Hex | Where it leads on the homepage |
|---|---|---|
| `--gold-100` | `#F6E7B2` | `--ah-gold-pale` — titles, primary headings, active states (the brightest gold) |
| `--gold-200` | `#E7C878` | `--ah-gold-warm` — **functional/navigation text** (counter, hint); 12.16:1 on near-black |
| `--gold-300` | `#C8A24C` | `--ah-gold` — default gold: rules, ring borders, glows, the brand "metal" |
| `--gold-400` | `#9A7B36` | deep gold for gradient bottoms / shadow-side metal (4.95:1 — **borderline**, decorative use only) |
| `--gold-500` | `#6E5527` | `--ah-gold-dim` — fails AA for text (2.81:1); structural/ornament only, never body copy |
| `--gold-600` | `#4A3A1C` | deepest structural gold |

### 2.3 The two "legible golds" (read this before touching any gold text)

The hero runs **two** AA-safe golds, by intent:

- **`--gold-200` (`#E7C878`, 12.16:1)** — for *functional* UI text that must be unmistakably legible:
  the counter index, the `← → TO JOURNEY` hint, the card-number eyebrow (`arcana-hero.css:147, 352, 357`).
- **A burnished `#C9A84C` (8.64:1)** — for *gold-toned label* text that should read as warm metal rather
  than bright type: keywords (`.kw`), `--ah-text-mute`, and the entire primary-CTA gradient. It exists
  precisely because `--gold-400` (4.95:1) is too dim for small tracked caps but `--gold-200` looks too
  yellow as a fill.

> ⚠️ **`#C9A84C` is load-bearing and currently un-tokenized — it appears as a raw literal 16× in
> `arcana-hero.css`.** Treat it as a real palette value. If you add gold *label* text, use this value
> (or token it — backlog **R1**). Don't substitute `--gold-400`; you'll silently fall below AA.

### 2.4 Text colors

| Token / value | Hex | Role |
|---|---|---|
| `--parchment` | `#E8DFC8` | Reserved warm ivory (≈14:1) — body copy register |
| `--ah-text-dim` (`#D7CEB4`) | — | Descriptions, secondary copy; lifted ~+12% L above `--parchment-dim` for AA |
| `--ah-text-mute` (`#C9A84C`) | — | Muted gold meta labels (the burnished gold, §2.3) |

### 2.5 Color do / don't

- ✅ Build hierarchy with **pale → burnished → dim gold** on near-black.
- ✅ Use `--gold-200` for any *functional* gold text; `#C9A84C` for any gold *label/fill*.
- ❌ Don't introduce the suit/jewel accents on the homepage. They belong to `/cards` and `/card/<id>`.
- ❌ Don't use `--gold-400`/`--gold-500` for text — they fail or barely scrape AA.
- ❌ Don't add a new gold hex. We already have one orphan (`#C9A84C`); a second starts a swatch zoo.

---

## 3. Typography

### 3.1 Fonts actually used on the homepage

Only **three** of the loaded families render here. Map every new element to one of these roles:

| Role token | Family | Homepage usage |
|---|---|---|
| `--font-display` | **Cinzel** | Eyebrow, card number, title, roman numeral, keywords, meta `dd`, CTA, counter, nav — i.e. **almost everything structural** |
| `--font-body` | **EB Garamond** | The card description paragraph (inherited via `.arcana-hero { font-family: var(--font-body) }`) |
| `--font-mono` | **JetBrains Mono** | Meta `dt` labels (ELEMENT / SYMBOL) and the `← →` counter hint — the "technical" register |

`--font-accent` (**Cormorant Garamond**) is defined but **not used on the homepage** — it's the card-name
face on the deck/detail pages. Keep it off the home hero unless you're deliberately echoing a card page.

> 🧹 **`Almendra Display`, `IM Fell English`, `Cormorant SC` are loaded in `base.html:9` but used
> nowhere in live CSS** (only in retired `?hero=` experiments — audit F8/F3). They're dead weight on
> every page load. See backlog **R2**.

### 3.2 The effective hero type scale

The hero sets sizes as **raw px**, not the `--step-*` tokens (audit F4). The *de-facto* scale below is
the contract — match it rather than inventing new sizes:

| Element | Size | Tracking | Transform | Notes |
|---|---|---|---|---|
| Card title (`.card-title`) | `clamp(28px, 3.5vw, 52px)` | `-0.005em` | as-authored | weight 500, `line-height: .9`, reserves 2 lines so the layout never reflows between cards |
| Roman numeral (`.card-roman`) | `20px` | `0.25em` | — | opacity .8 |
| Symbol glyph (`.meta-symbol`) | `34px` | `0` | — | luminous, double text-shadow |
| Eyebrow (`.eyebrow`) | `12px` | `0.45em` | uppercase | the widest tracking on the page |
| Card number / meta / counter | `11–12px` | `0.2–0.32em` | uppercase | the "small tracked caps" workhorse |
| Description (`.card-desc`) | `15px` / `1.6` | normal | sentence case | the **only** non-caps, non-tracked text block |
| Keywords (`.kw`) | `11px` | `0.18em` | uppercase | tighter tracking so 3-keyword lines don't orphan |
| Nav label (`.nav-btn-label`) | `9px` | `0.3em` | uppercase | smallest type; decorative, not critical |

**Tracking convention:** the smaller and more "caps" the text, the **wider** the tracking
(`--track-label: 0.2em` is the baseline; eyebrows go to `0.45em`). Body copy is the lone exception — set
naturally at `1.6` line-height, never tracked.

### 3.3 Type do / don't

- ✅ Set structural/label text in **Cinzel uppercase with wide tracking**; set the one prose paragraph in
  **EB Garamond**, sentence case, untracked.
- ✅ Keep titles to `line-height: .9` and reserve their height so clicking through cards never reflows.
- ❌ Don't bring `Cormorant`/`IM Fell`/`Almendra` onto the home hero — it breaks the Cinzel discipline.
- ❌ Don't add a new px size that isn't in the table above without a reason; prefer the nearest existing step.

---

## 4. Layout & spacing

### 4.1 The composition

A centered, content-sized **two-column grid** (`arcana-hero.css:33–58`):

```
grid-template-columns: minmax(360px, 460px)  auto
                       └── text spec-sheet ──┘ └ luminous card ┘
column-gap: clamp(8px, 1vw, 16px)   ·   max-width: 1400px   ·   margin-inline: auto
min-height: 100vh (full-bleed; navbar overlays transparently)
```

The two columns are pulled **close together on purpose** — the card's feathered transparent margin
supplies the breathing room, so a wide gap would re-open a "dead chasm" between text and art. The whole
group is centered, with a small right-bias `padding-left` to balance the card's glow-filled right margin.

- **Left column** is vertically centered, light symmetric padding (no heavy left indent that pins text to
  the edge). The progress counter sits at the *bottom* via `margin-top: auto`.
- **Right column** is pinned to `100vh` and the card is **height-bound first, width-capped second**
  (`--card-h-by-height` vs `--card-w-max`, `arcana-hero.css:508–540`) so the card never reacts to a long
  wrapping title and never crowds the navbar.

### 4.2 Spacing

Global scale (`tokens.css:53–59`, 8px-ish base): `--space-1 .5rem`, `-2 .75rem`, `-3 1rem`, `-4 1.5rem`,
`-5 2.5rem`, `-6 4rem`, `-7 6rem`.

> The hero currently spaces with **raw px** (`18px`, `14px`, `24px`, `10px`…) rather than `--space-*`
> (audit F4). The *rhythm* to preserve: ~10–14px between stacked text rows, ~18–24px around section
> groups, 36px between the two meta columns. Backlog **R3** proposes adopting the tokens.

### 4.3 Responsive contract

| Breakpoint | What changes |
|---|---|
| `> 1200px` | Full two-column composition; 52px nav discs |
| `≤ 1200px` | Text column tightens to `minmax(320px, 420px)`; nav discs → 44px; gap widens slightly |
| `≤ 900px` | **Single column** — text stacks above the card; hero `min-height: auto` (page scrolls); card uses ~78vw width; nav discs move to 6% insets |

Rule: the card and text must always read as **one grouped composition**, never as two elements pinned to
opposite screen edges. That's why the grid is centered and content-sized rather than `1fr 1fr`.

---

## 5. Light, depth & material

This is the homepage's signature — the "how does gold-on-black feel expensive" layer.

- **Card depth:** stacked shadows put the card "in front of" the scene — a deep `0 0 220px` gold ambient
  glow, a tighter `80px` warm glow, a black drop, and an inset vignette (`arcana-hero.css:541–551`).
- **Button material (primary CTA):** a 3-stop burnished-gold vertical gradient with an **inset top
  specular** catchlight + inner warmth + outer ambient glow (`arcana-hero.css:254–283`). This is the
  recipe for "polished metal" — top-light slightly brighter gold, base deepened toward `--gold-400`,
  never a flat fill.
- **Glows use `color-mix` over the gold tokens**, not new colors — e.g.
  `color-mix(in srgb, var(--gold-300) 48%, transparent)`. Keep new glows in this idiom so they stay in
  the family.
- **Ambient field:** scattered gold square `--hero-spark` glints and a sparse `--hero-drift` of mosaic
  chips drifting off the card edge — *faint and slow*, so the card stays the focus. Both pause during a
  card transition and vanish under `prefers-reduced-motion`.
- **Selection / focus:** nav discs show a clearly-lit ring + gold glow on `:hover`/`:focus-visible`
  (`arcana-hero.css:733–745`) — interactive controls must visibly respond.

**Do:** express elevation with glow + inset specular + soft shadow.
**Don't:** add hard borders, flat fills, or drop-shadows in a non-gold color.

---

## 6. Motion

| Property | Value / pattern | Where |
|---|---|---|
| Base UI transition | `--transition: 0.28s ease` (`style.css:50`) | hover/color/box-shadow everywhere |
| Card flip (swap) | `~0.36–0.38s`, `cubic-bezier(.22,.7,.3,1)` in / `(.55,.02,.42,1)` out; 3D `rotateY` crossfade with a brightness+blur bloom | `.main-card-layer.is-in/out` |
| Text cascade | stack fades/blurs out, then children stagger in at 0/35/70/105/140/175ms | `.text-stack.is-in > *` |
| Direction-aware | `dir-prev` mirrors the X-offset so "previous" feels like moving left | `ahTextInPrev`, `ahLayerInPrev` |
| Swap accents | gold `shimmer-pulse` (screen blend), center `seam`, satellite `pop` | fire once per swap |
| Ambient | `heroSparkTwinkle 5s`, `heroDrift 8s` — slow, infinite, low-opacity | background only |

**Principles:** (1) entrances finish *inside* the flip window (~250ms cascade ceiling) so nothing lags;
(2) direction has meaning (prev vs next mirror); (3) **every** decorative animation has a
`prefers-reduced-motion: reduce` off-switch (`arcana-hero.css:502–505`). Honor all three.

---

## 7. Component reference (homepage)

Anatomy of the left spec-sheet and its controls. Match these when adding to the hero.

- **Eyebrow row** — `30px` gold hairline `+` 12px Cinzel caps at `0.45em`. The page's "we're starting" mark.
- **Card title block** — `CARD <roman>` numeral (Roman everywhere — `CARD I`, never `CARD 01`) →
  `H1` title (Cinzel 500, clamp, 2-line reserved) → roman numeral. The numerals frame the title
  like a catalog entry.
- **Keyword row** — Cinzel caps `.kw` at `0.18em`, separated by a **diamond drawn inside each keyword**
  via `::before` (so it never strands on a wrap, `arcana-hero.css:185–193`). Color is the burnished
  `#C9A84C` (§2.3).
- **Meta `<dl>`** — two columns, `dt` in JetBrains Mono muted gold, `dd` in Cinzel pale gold; the SYMBOL
  `dd` is an oversized luminous glyph. Separated from copy by a `--ah-gold-ghost` hairline.
- **Primary CTA `.btn-primary`** — burnished-metal gradient button (§5), Cinzel `0.25em` caps, leading
  diamond `.btn-dot`, `min-height: 44px` (touch target). *Hero-scoped override* of the sitewide solid-amber
  button.
- **Secondary CTA `.btn-ghost`** — borderless text button, dim→pale-gold on hover. *(Audit F5: this is the
  hero's private name for what the rest of the app calls `.btn-outline`. See backlog **R4**.)*
- **Progress counter** — `← idx [track w/ ticks] XXI →`; the fill + active tick glow track position; the
  just-activated tick "pops". Functional text uses `--gold-200` (§2.3).
- **Nav discs (`.nav-btn`)** — 52px gold-ringed roman-numeral discs flanking the composition; lit ring +
  glow on hover/focus; `z-index: 20` so the oversized card layers can't swallow their clicks.

---

## 8. Refinement backlog (homepage-specific)

Ordered by payoff ÷ risk. These *refine* the existing look — none change the visual result if done
carefully; they make the system honest about what it already does. IDs cross-reference the audit.

| # | Refinement | Why | Effort / Risk | Audit |
|---|---|---|---|---|
| **R1** | **Promote `#C9A84C` to a token** (e.g. `--gold-250` or `--gold-aa`) in `tokens.css`; replace the 16 inline literals in `arcana-hero.css`. | A load-bearing AA-legible gold is invisible as a raw hex repeated 16×; the next editor won't know it exists or why. Tokening it *documents the accessibility contract in the code*. | Low / Low (no visual change) | F4 |
| **R2** | **Drop `Almendra Display`, `IM Fell English`, `Cormorant SC`** from `base.html:9`. | Three font families download on every page for zero live usage (only retired `?hero=` experiments referenced them). Pure performance win. | Low / Low *(do after the `?hero=` variants are retired — F3)* | F3/F8 |
| **R3** | **Adopt `--space-*`** for the hero's raw px gaps/paddings where they already match the scale. | The hero inherits the token system but bypasses it; adopting it keeps rhythm consistent and edits predictable. | Med / Low (mechanical) | F4 |
| **R4** | **Alias `.btn-ghost` → `.btn-outline`** (or fold it in). | Every other page's secondary button is `.btn-outline`; the hero invented a private name. One vocabulary = no drift. | Low / Med (re-test hover/focus) | F5 |
| **R5** | **Token the body-background literals** (`#11101c/#08070f/#050409`) against the `--ink-*` ramp (add a `--bg-deep` if needed). | The most important background on the site is set in raw hex that nearly-but-doesn't match `--ink-900`. | Low / Low | F12 |
| **R6** | **Adopt `--step-*`** for the hero's px font sizes (or codify the §3.2 table as the canonical hero scale if you prefer px clamps). | Either adopt the scale or *decide* px-clamps are the hero's intentional exception — today it's neither, just drift. | Med / Low | F4 |

---

## 9. Open decisions for you

These are genuine judgment calls the guide can't make for you — your answer sets the canon:

1. **Name for the burnished gold (R1):** `--gold-250` (fits the ramp numerically) vs `--gold-aa` (names
   its *purpose* — accessibility). I lean `--gold-250` for consistency with the existing ramp.
2. **Hero type scale (R6):** migrate to `--step-*`, or bless the px/clamp table in §3.2 as the hero's
   deliberate exception? The clamps give finer fluid control than the fixed steps — there's a real
   trade-off here.
3. **`#C9A84C` vs `--gold-200` boundary (§2.3):** keep two legible golds (functional vs label), or
   consolidate to one? Two is more nuanced but more to maintain; one is simpler but flattens the
   functional/label distinction.

---

*This guide describes the homepage as it ships on `claude/tarot-app-project-dSzbt` as of 2026-06-06.
When the Tier-A refinements (R1–R5) land, update §2.3 and §3.1 so the guide and the code stay in lockstep.*
