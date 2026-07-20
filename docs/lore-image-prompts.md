# Lore plates — image prompts

Generation prompts for every illustration slot on `/lore`.

## How the slots work

Each plate is declared in `data/lore_data.py` via `_img(slug, alt, caption)`. The
app looks for `static/images/lore/<slug>.<ext>` trying `.webp`, `.jpg`, `.jpeg`,
`.png` in that order (`app.py:lore_image_url`). If nothing is there, the template
renders an engraved empty cartouche instead — so **every plate is optional** and
the page always looks finished. Drop art in one file at a time and restart Flask
(the existence check is `lru_cache`d for the process's life).

```
static/images/lore/            ← create this folder; it is gitignored like the card art
  hero-atmosphere.webp
  history-triumphs.webp
  ...
```

Prefer `.webp` at roughly 1600px on the long edge — that is what the card art
ships as, and the plates never render larger than ~900px except in the lightbox.

## The house style (prepend to every prompt)

> Dark academia tarot illustration, candlelit near-black background (#0A0B11)
> with a midnight-indigo undertone, lit by a single warm off-frame candle.
> Restrained antique-gold palette (#C8A24C) with muted jewel accents — lapis
> blue, oxblood red, verdigris green — and warm parchment highlights. Painterly
> Art-Nouveau / 19th-century engraving feel, aged paper and gold-leaf texture,
> deep shadow, low saturation, strong vignette, cinematic chiaroscuro. No text,
> no lettering, no watermark, no modern objects.

The page grades every plate down on rest (`saturate(.72) brightness(.82)`) and
lifts it on hover, so generate slightly **brighter and more saturated** than the
final look — art that is already murky will disappear into the ground.

Suggested negative prompt: `text, letters, numbers, watermark, signature, modern
clothing, plastic, neon, oversaturated, flat lighting, cartoon, 3D render, blurry`

---

## Tier 1 — the plates that carry the page

### `hero-atmosphere` · 16:9 · full-bleed hero backdrop
A dim reading table seen from a low three-quarter angle: tarot cards spread
face-down across dark velvet, a burning candle at the left edge, an open book
and a scatter of dried petals. Deep negative space through the upper middle of
the frame — the page title sits there, so keep that area quiet and dark.

### History — the timeline (each 4:3, alternating left/right)

**`history-triumphs`** — Mid-15th-century Milanese court interior. Four
hand-painted, gold-leafed trump cards fanned on a carved wooden table beside a
goblet; heavy brocade and a shuttered window behind. Gilding catching candlelight.

**`history-marseille`** — A French cardmaker's workshop: a carved wooden
printing block, freshly pulled uncoloured sheets of tarot trumps hanging to dry,
stencil brushes and pigment pots. Sawdust in the air, daylight from one high window.

**`history-egyptian-myth`** — An 18th-century scholar's fantasy of Egypt: an
open folio showing an engraved plate of a temple wall where tarot-like figures
appear among hieroglyphs, a candle and brass dividers beside it. Learned, dusty,
faintly absurd grandeur.

**`history-etteilla`** — A candlelit Parisian parlour, late 1700s. A cartomancer
in a dark coat laying a row of cards on a small round table for a seated client;
both seen from the side, faces half in shadow. Intimate, hushed, conspiratorial.

**`history-kabbalah`** — An esotericist's desk: a large ink-drawn Tree of Life
diagram, ten spheres joined by twenty-two paths, small tarot trumps drawn along
the paths. Hebrew-letter-like marks kept abstract and illegible. Compass, ink pot,
guttering candle.

**`history-rws`** — An illustrator's drawing table, 1909. Pen-and-ink drawings of
narrative pip cards in progress, a wash of colour on one, brushes in a jar, a
woman's hand resting at the edge of the sheet. Grey London daylight, warm lamp.

**`history-thoth`** — A painter's studio, 1940s. Bold geometric Art-Deco tarot
paintings — sharp prisms, radiant symmetry, vivid colour — propped on an easel
and drying against the wall. Colour more saturated than the other plates on purpose.

**`history-today`** — Present day, plain and warm: two hands laying three cards
on a bare wooden table beside a cup of tea and a phone face-down. Soft window
light, no mysticism — the quiet, domestic end of the story.

### Deck structure (each 16:10)

**`deck-major`** — Twenty-two trump cards fanned in a wide, even arc on dark
cloth, backs and gilt edges catching the light, one card face-up at the centre of
the arc. Symmetrical, ceremonial, overhead view.

**`deck-minor`** — Overhead view of four neat vertical columns of pip cards, one
column per suit, laid out on dark cloth; a wand, a chalice, a sword and a gold
coin resting at the head of their columns. Orderly, catalogued, slightly austere.

### The four suits (each 3:4 — portrait, they sit beside the text)

**`suit-wands`** — A budding wooden staff standing upright, wreathed in low
flame, sparks rising into the dark. Amber and gold; heat without a fire's chaos.

**`suit-cups`** — An ornate chalice brimming and overflowing into a still black
pool, concentric ripples spreading. Lapis blue and silver-grey, moonlit.

**`suit-swords`** — A single upright sword, edge catching cold light, cutting
through streaming cloud and wind. Pale tarnished gold and slate; high, thin air.

**`suit-pentacles`** — A large gold coin stamped with a pentacle, half-buried in
dark soil among roots and green shoots. Verdigris and earth; patient, mineral.

### Symbols — the motif plates (each 4:3)

**`symbol-lemniscate`** — A glowing figure-eight of golden light hovering above a
bowed, hooded head. Weightless, endless, self-renewing.

**`symbol-pillars`** — A black pillar and a white pillar flanking a veiled
doorway; behind the veil, only depth. Frontal, symmetrical, temple-like.

**`symbol-water`** — A still dark pool holding the reflection of a thin crescent
moon, one reed at the edge, the far bank lost in mist.

**`symbol-mountains`** — Cold blue-grey peaks rising sharply behind a low, empty
plain; a single small figure at the bottom of the frame for scale.

**`symbol-sun`** — A radiant sun with a calm human face, rays alternating straight
and wavy, above a walled garden of sunflowers. Warm, generous, unafraid.

**`symbol-moon`** — A crescent moon with a downturned, sleeping face, pale drops
of light falling from it onto a path between two towers.

**`symbol-roses`** — Red roses and white lilies growing entwined on a single
iron trellis, a few petals fallen. Passion and purity in one frame.

**`symbol-crowns`** — A thin gold crown hovering just above an empty carved
throne, a faint halo of light behind it. Authority without an occupant.

### `ethos-band` · 21:9 · full-bleed closing band
A wide, dim interior — bare table, one chair, a single tarot card lying face-up
under a pool of candlelight, the rest of the room falling away into darkness.
Very still. Keep the centre dark enough for white text to sit over it.

---

## Tier 2 — the numerology ladder (each 1:1, square)

These fill the detail panel when a reader picks a rank. Fourteen small,
emblematic images; treat them as engraved vignettes rather than scenes.

| Slug | Prompt (after the house style) |
|---|---|
| `num-ace` | A single seed held in an open palm, lit faintly from within. |
| `num-two` | Two scale pans hanging level, perfectly balanced, nothing in either. |
| `num-three` | Three young shoots breaking the same patch of soil together. |
| `num-four` | Four stone pillars holding one plain lintel; solid, unadorned. |
| `num-five` | A cracked stone slab split by one clean fissure, dust settling. |
| `num-six` | Two hands passing a small lit oil lamp between them. |
| `num-seven` | A figure's reflection in still black water, head tilted, considering. |
| `num-eight` | Eight streaks of light crossing a night sky in one direction. |
| `num-nine` | A lantern burning at its brightest, the glass hot and near its limit. |
| `num-ten` | A ripe vessel brimming over, one seed falling out of the spill. |
| `court-page` | A young messenger halted on a road, sealed letter in hand, looking up. |
| `court-knight` | A rider at full gallop, cloak streaming, eyes fixed ahead. |
| `court-queen` | A seated queen holding her suit's emblem close to her chest, gaze inward. |
| `court-king` | An enthroned king holding his suit's emblem out before him, gaze outward. |

Keep the court four consistent with one another — same framing, same throne-room
darkness — so the ladder reads as one set when a reader clicks through it.

---

## Checklist when the art arrives

1. Save as `static/images/lore/<slug>.webp` (exact slug from `lore_data.py`).
2. Restart Flask — the resolver caches misses for the process's life.
3. Check the plate on `/lore`: it should read *dimmer* than the source file at
   rest and lift on hover. If it disappears into the page, the source was too
   dark; if it shouts, it was too saturated.
4. Click it — the lightbox shows the full-size file, so it is worth exporting at
   1600px even though the page renders it small.
