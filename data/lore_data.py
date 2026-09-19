# lore_data.py
# Editorial content for the "Lore" section — the history and symbolism of tarot.
# This is the single source of truth for the /lore page, mirroring how
# tarot_data.py holds the card data. Content is structured (not free HTML) so the
# template stays presentational and the copy stays easy to edit and test.
#
# Illustration slots
# ------------------
# Most entries carry an `image` built by _img(). The `slug` names a file the app
# looks for at static/images/lore/<slug>.<webp|jpg|jpeg|png>; when no such file
# exists the template renders an engraved empty cartouche instead, so the page
# reads as finished art-direction rather than a broken image. Prompts for
# generating the plates live in docs/lore-image-prompts.md — keep the slugs here
# and the headings there in sync.


def _img(slug, alt, caption='', focus=''):
    """One illustration slot. `alt` is the accessible description, `caption` the
    visible engraved line under the plate (and the label shown while empty).

    `focus` is an optional CSS `object-position` value ('25% 50%'). Slots that
    crop their art to fit a fixed frame otherwise keep the centre; set this when
    the subject sits off-centre and centring would cut it out."""
    return {'slug': slug, 'alt': alt, 'caption': caption, 'focus': focus}


# ── Framing ───────────────────────────────────────────────────────────────────
LORE_INTRO = (
    "Long before it was an oracle, the tarot was a game. Its seventy-eight cards "
    "carry six centuries of accumulated meaning — a visual language of archetype "
    "and symbol assembled from Renaissance courts, esoteric revival, and a "
    "century of artists reading their own lives into the images. What follows is "
    "a short field-guide to where the cards came from and how to read what they "
    "show."
)

# The atmospheric plate behind the page hero.
LORE_HERO_IMAGE = _img(
    'hero-atmosphere',
    'A candlelit table strewn with tarot cards, an open book and a burning candle.',
    'The reading table',
)

# The five chapters, in page order — drives the sticky chapter rail and the
# scroll-spy in lore.js. `id` must match the corresponding <section id>.
CHAPTERS = [
    {'id': 'history',    'num': 'I',   'label': 'History'},
    {'id': 'structure',  'num': 'II',  'label': 'The Deck'},
    {'id': 'suits',      'num': 'III', 'label': 'The Suits'},
    {'id': 'numerology', 'num': 'IV',  'label': 'Numbers'},
    {'id': 'symbols',    'num': 'V',   'label': 'Symbols'},
]

# ── History & origins ─────────────────────────────────────────────────────────
# An ordered timeline. Each entry: era label, title, a paragraph of context, and
# an illustration plate.
HISTORY_TIMELINE = [
    {
        'era': 'c. 1440',
        'title': 'A game of triumphs',
        'text': (
            "Tarot begins in the courts of northern Italy as a deck of playing "
            "cards. Added to the ordinary four suits was a fifth run of "
            "allegorical trumps — the carte da trionfi, or “triumph cards” "
            "— for a trick-taking game that would become known as tarocchi. The "
            "surviving hand-painted Visconti-Sforza decks of mid-century Milan are "
            "the earliest we still have, gold-leafed and made for nobility."
        ),
        'image': _img(
            'history-triumphs',
            'Gold-leafed hand-painted trump cards fanned across a Renaissance table.',
            'Milan, c. 1440 — the Visconti-Sforza trumps',
            # The candle — the scene's only light source — sits hard against the
            # left edge, so a centred crop loses it. Bias left to keep it.
            focus='25% 50%',
        ),
    },
    {
        'era': '15th–18th c.',
        'title': 'Three centuries of play',
        'text': (
            "For roughly three hundred years the tarot travelled Europe purely as "
            "a card game, spreading from Italy into France, Switzerland, and "
            "beyond. The Tarot de Marseille pattern, standardised by French "
            "cardmakers, fixed the imagery of the trumps that nearly every later "
            "deck would inherit. No one, yet, was telling fortunes with it."
        ),
        'image': _img(
            'history-marseille',
            'A woodblock and printed Tarot de Marseille sheets in a French workshop.',
            'The Marseille pattern, cut in wood',
        ),
    },
    {
        'era': '1781',
        'title': 'The Egyptian myth',
        'text': (
            "The Swiss cleric Antoine Court de Gébelin published an essay "
            "declaring the tarot a survival of ancient Egyptian wisdom — the lost "
            "“Book of Thoth,” its secrets hidden in a card game. The claim "
            "was historically groundless, but it was electric: for the first time "
            "the tarot was read as a repository of esoteric knowledge rather than "
            "a pastime."
        ),
        'image': _img(
            'history-egyptian-myth',
            'An 18th-century engraving imagining tarot as Egyptian temple wisdom.',
            'The Book of Thoth that never was',
        ),
    },
    {
        'era': '1780s–1790s',
        'title': 'Etteilla and cartomancy',
        'text': (
            "The Parisian occultist Jean-Baptiste Alliette, writing his name "
            "backwards as “Etteilla,” turned the idea into a practice. He "
            "published methods for divining with the cards, designed a deck built "
            "for reading, and became the first professional tarot cartomancer — "
            "pairing each card with upright and reversed meanings much as readers "
            "do today."
        ),
        'image': _img(
            'history-etteilla',
            'A candlelit Parisian parlour with a cartomancer laying cards for a client.',
            'Paris — the first professional reader',
        ),
    },
    {
        'era': '19th century',
        'title': 'Kabbalah and correspondence',
        'text': (
            "French esotericists, chief among them Éliphas Lévi, wove the "
            "tarot into the Kabbalah, mapping the twenty-two trumps onto the "
            "letters of the Hebrew alphabet and the paths of the Tree of Life. The "
            "cards were no longer just pictures; they were a system of "
            "correspondences linking the deck to astrology, the elements, and the "
            "cosmos."
        ),
        'image': _img(
            'history-kabbalah',
            'A Tree of Life diagram with tarot trumps drawn along its connecting paths.',
            'Twenty-two trumps, twenty-two paths',
        ),
    },
    {
        'era': '1909',
        'title': 'The Rider–Waite–Smith deck',
        'text': (
            "Working from the teachings of the Hermetic Order of the Golden Dawn, "
            "the scholar A. E. Waite and the artist Pamela Colman Smith created "
            "the deck that would define modern tarot. Its quiet revolution was the "
            "minor arcana: for the first time every pip card carried a full scene, "
            "not just an arrangement of suit symbols, giving the whole deck a "
            "readable narrative. Nearly every deck since is drawn in its shadow."
        ),
        'image': _img(
            'history-rws',
            'An illustrator’s desk with ink drawings of narrative pip cards in progress.',
            'Pamela Colman Smith’s drawing table, 1909',
        ),
    },
    {
        'era': '1943',
        'title': 'The Thoth tarot',
        'text': (
            "Aleister Crowley and the painter Lady Frieda Harris completed the "
            "Thoth deck, a dense synthesis of astrology, Kabbalah, and Crowley’s "
            "own philosophy. Published only after both their deaths, it became the "
            "second great root system of contemporary tarot alongside the "
            "Rider–Waite–Smith."
        ),
        'image': _img(
            'history-thoth',
            'Vivid geometric Art Deco tarot paintings drying on a studio easel.',
            'Lady Frieda Harris’s studio',
        ),
    },
    {
        'era': 'Today',
        'title': 'A mirror for reflection',
        'text': (
            "The last century has seen the tarot bloom into thousands of decks and "
            "traditions. For most who use it now, the cards are less a machine for "
            "predicting the future than a mirror for the present — a set of "
            "archetypal prompts that invite you to slow down, name what you already "
            "sense, and look at your situation from an unfamiliar angle."
        ),
        'image': _img(
            'history-today',
            'Modern hands laying three cards on a plain table beside a cup of tea.',
            'The cards as a mirror, now',
        ),
    },
]

# ── Structure of the deck ─────────────────────────────────────────────────────
DECK_STRUCTURE = {
    'intro': (
        "A tarot deck is seventy-eight cards in two parts. Learn how the halves "
        "differ and the whole deck starts to read like a single, layered story."
    ),
    'parts': [
        {
            'glyph': '✦',
            'name': 'The Major Arcana',
            'count': '22 cards',
            'text': (
                "Numbered from the Fool (0) to the World (XXI), the trumps are the "
                "deck’s spine — the great archetypes and turning points of a "
                "life. Read in sequence they trace “the Fool’s journey,” "
                "an allegory of the soul passing from innocence through trial to "
                "wholeness. When a major card appears in a reading, it speaks to "
                "the larger forces at work rather than the passing details."
            ),
            'image': _img(
                'deck-major',
                'Twenty-two trump cards fanned in a wide arc, gold-edged, the Fool at centre.',
                'The trumps, nought to twenty-one',
            ),
        },
        {
            'glyph': '✧',
            'name': 'The Minor Arcana',
            'count': '56 cards',
            'text': (
                "Four suits of fourteen cards each — ace through ten, then Page, "
                "Knight, Queen, and King. Where the trumps speak of fate, the minor "
                "arcana speak of daily life: the work, feelings, thoughts, and "
                "material circumstances through which those larger forces actually "
                "reach us. Each card is a suit (a domain of experience) crossed with "
                "a number or rank (a stage within it)."
            ),
            'image': _img(
                'deck-minor',
                'The fourteen Wands cards fanned in an arc, ace through king, the Ace at centre.',
                'Four suits, fourteen ranks',
            ),
        },
    ],
}

# ── The four suits & their elements ───────────────────────────────────────────
# `slug` maps to the canonical --suit-<slug> token in tokens.css (set once there);
# `glyph` reuses the alchemical marks the /cards suit tiles already use.
SUITS = [
    {
        'slug': 'wands',
        'glyph': '△',
        'name': 'Wands',
        'element': 'Fire',
        'domain': 'Will · Passion · Creation',
        'text': (
            "The suit of fire governs drive, ambition, and the creative spark — "
            "the energy that moves you to act. Wands are inspiration and "
            "enterprise, the projects you throw yourself into and the will that "
            "carries them. Their shadow is burnout, haste, and scattered force."
        ),
        'image': _img(
            'suit-wands',
            'A budding wooden staff wreathed in low flame against dark ground.',
            '',   # the element already labels the tile
        ),
    },
    {
        'slug': 'cups',
        'glyph': '▽',
        'name': 'Cups',
        'element': 'Water',
        'domain': 'Emotion · Love · Intuition',
        'text': (
            "The suit of water holds the life of feeling — love, friendship, "
            "grief, and the quiet currents of intuition. Cups are relationships "
            "and the inner world, what the heart knows before the mind does. Their "
            "shadow is illusion, moodiness, and emotion left to stagnate."
        ),
        'image': _img(
            'suit-cups',
            'A brimming chalice overflowing into still dark water.',
            '',   # the element already labels the tile
        ),
    },
    {
        'slug': 'swords',
        'glyph': '✕',
        'name': 'Swords',
        'element': 'Air',
        'domain': 'Intellect · Truth · Conflict',
        'text': (
            "The suit of air is the realm of the mind — thought, reason, truth, "
            "and communication, but also conflict and the pain that clear sight "
            "can bring. Swords cut both ways: they name the ideas that free you "
            "and the anxieties that wound. Their shadow is cruelty, overthinking, "
            "and cold judgment."
        ),
        'image': _img(
            'suit-swords',
            'An upright sword cutting through moving cloud and wind.',
            '',   # the element already labels the tile
        ),
    },
    {
        'slug': 'pentacles',
        'glyph': '⊕',
        'name': 'Pentacles',
        'element': 'Earth',
        'domain': 'Body · Work · Resources',
        'text': (
            "The suit of earth grounds the deck in the material world — the body, "
            "work, money, home, and craft. Pentacles are what you build and tend "
            "over time, the slow rewards of patience and skill. Their shadow is "
            "greed, stagnation, and worth measured only in possessions."
        ),
        'image': _img(
            'suit-pentacles',
            'A golden pentacle coin half-buried in dark soil among roots.',
            '',   # the element already labels the tile
        ),
    },
]

# ── Numerology of the pips and courts ─────────────────────────────────────────
# Pips and courts are rendered as an interactive ladder: pick a rank, read its
# stage. Each carries its own plate so the detail panel has something to show.
# `text` is the lead — one line defining the stage, set large in the panel.
# `detail` expands it and closes on the stage's shadow, mirroring how SUITS
# entries end; the template sets it smaller and dimmer beneath the lead.
NUMEROLOGY = {
    'intro': (
        "Within each suit, the number or rank marks a stage — a moment in the arc "
        "from first spark to fulfilment. The suit says which part of life; the "
        "number says where along its path you stand."
    ),
    'pips': [
        {'rank': 'Ace', 'numeral': 'I', 'title': 'The seed', 'text': 'Pure potential — the suit’s gift, offered whole and unspent.',
         'detail': (
             "Nothing has been spent yet and nothing proven; an Ace is an offer, "
             "not an outcome. Its shadow is potential admired so long it is never "
             "planted."
         ),
         'image': _img('num-ace', 'A single seed held in an open hand, faintly lit from within.', 'Ace — the seed')},
        {'rank': 'Two', 'numeral': 'II', 'title': 'Balance', 'text': 'Duality and choice; partnership, tension, the meeting of two.',
         'detail': (
             "Where the Ace stood alone, the Two must reckon with something outside "
             "itself — a partner, an alternative, a counterweight. Its shadow is the "
             "choice deferred until it is made for you."
         ),
         'image': _img('num-two', 'Two balanced scales pans held level in dim gold light.', 'Two — balance')},
        {'rank': 'Three', 'numeral': 'III', 'title': 'Growth', 'text': 'The first fruits — creation, collaboration, early increase.',
         'detail': (
             "What two began, three brings into the world; this is the first proof "
             "the thing can live. Its shadow is early increase mistaken for arrival."
         ),
         'image': _img('num-three', 'Three young shoots breaking soil together.', 'Three — growth')},
        {'rank': 'Four', 'numeral': 'IV', 'title': 'Structure', 'text': 'Stability and rest; a foundation set, for better or for stasis.',
         'detail': (
             "Four is the square and the four walls — what growth needs in order to "
             "hold its shape. Its shadow is the wall that keeps out as much as it "
             "keeps safe."
         ),
         'image': _img('num-four', 'Four stone pillars holding a plain lintel.', 'Four — structure')},
        {'rank': 'Five', 'numeral': 'V', 'title': 'Disruption', 'text': 'Conflict, loss, or challenge — the change that breaks the four.',
         'detail': (
             "Every suit meets its trouble at five: the structure is tested, and "
             "something gives. Its shadow is the wound nursed long after the lesson "
             "has been taken."
         ),
         'image': _img('num-five', 'A cracked stone slab split by a single fissure.', 'Five — disruption')},
        {'rank': 'Six', 'numeral': 'VI', 'title': 'Harmony', 'text': 'Balance restored, reciprocity, movement gently forward.',
         'detail': (
             "After the break, six is the mending — what is given and returned, and "
             "the road opening again. Its shadow is a peace kept by leaving the hard "
             "thing unsaid."
         ),
         'image': _img('num-six', 'Two hands passing a small lit lamp between them.', 'Six — harmony')},
        {'rank': 'Seven', 'numeral': 'VII', 'title': 'Reflection', 'text': 'Assessment and perseverance; faith and effort put to the test.',
         'detail': (
             "Seven steps back from the work to ask whether it is worth continuing, "
             "and rarely finds a clean answer waiting. Its shadow is doubt that "
             "dresses itself as patience."
         ),
         'image': _img('num-seven', 'A figure’s reflection in still black water, considering.', 'Seven — reflection')},
        {'rank': 'Eight', 'numeral': 'VIII', 'title': 'Momentum', 'text': 'Mastery in motion — swift progress, focus, power applied.',
         'detail': (
             "Doubt resolves into practice, and the suit moves faster than it has "
             "all cycle. Its shadow is speed that outruns the reason for going."
         ),
         'image': _img('num-eight', 'Eight streaks of light crossing a night sky in one direction.', 'Eight — momentum')},
        {'rank': 'Nine', 'numeral': 'IX', 'title': 'Intensity', 'text': 'Near-fulfilment; the suit at its fullest pitch, for good or ill.',
         'detail': (
             "Nine is everything the suit can be, held at once and almost too much "
             "to carry. Its shadow is the strain of nearly-there — joy or dread "
             "stretched to its limit."
         ),
         'image': _img('num-nine', 'A lantern burning at its brightest, glass hot and near its limit.', 'Nine — intensity')},
        {'rank': 'Ten', 'numeral': 'X', 'title': 'Completion', 'text': 'The cycle’s end and overflow — and the seed of the next.',
         'detail': (
             "The suit arrives, and in arriving spills past what a single cycle can "
             "hold. Its shadow is the ending refused, or a beginning missed because "
             "the ending looked final."
         ),
         'image': _img('num-ten', 'A ripe vessel brimming over, one seed falling from the spill.', 'Ten — completion')},
    ],
    'courts': [
        {'rank': 'Page', 'numeral': 'P', 'title': 'The student', 'text': 'A beginner and messenger — the suit’s energy newly awakened, curious and unformed.',
         'detail': (
             "The Page has no mastery to defend and so can still be surprised; news, "
             "study, and first attempts belong here. Its shadow is enthusiasm that "
             "never settles into practice."
         ),
         'image': _img('court-page', 'A young messenger pausing on a road, letter in hand.', 'Page — the student')},
        {'rank': 'Knight', 'numeral': 'N', 'title': 'The seeker', 'text': 'The suit in motion and pursuit, driven and single-minded, sometimes to excess.',
         'detail': (
             "Where the Page wonders, the Knight rides — commitment to the suit at "
             "the cost of all that sits beside it. Its shadow is the pursuit "
             "continued long past the point of sense."
         ),
         'image': _img('court-knight', 'A rider at full gallop, cloak streaming, eyes fixed ahead.', 'Knight — the seeker')},
        {'rank': 'Queen', 'numeral': 'Q', 'title': 'The keeper', 'text': 'Inner mastery — one who embodies and nurtures the suit’s power from within.',
         'detail': (
             "The Queen holds the suit rather than chasing it, and can give it away "
             "without spending herself. Her shadow is care turned inward until it "
             "hardens into control."
         ),
         'image': _img('court-queen', 'A seated queen holding her suit’s emblem close, gaze inward.', 'Queen — the keeper')},
        {'rank': 'King', 'numeral': 'K', 'title': 'The sovereign', 'text': 'Outer mastery — authority, command, and the suit wielded in the world.',
         'detail': (
             "The King’s mastery faces outward: he sets the terms, and others live "
             "inside them. His shadow is authority that has forgotten it was ever "
             "learned."
         ),
         'image': _img('court-king', 'An enthroned king holding his suit’s emblem out before him.', 'King — the sovereign')},
    ],
}

# ── Common symbols & motifs ───────────────────────────────────────────────────
SYMBOLS = {
    'intro': (
        "The illustrated tarot speaks in a recurring vocabulary of images. Once "
        "you know a few of its words, the cards begin to converse with one another "
        "across a spread."
    ),
    'motifs': [
        {'glyph': '∞', 'slug': 'lemniscate', 'name': 'The lemniscate',
         'text': 'The sideways figure-eight of infinity — boundless energy and eternal renewal, crowning the Magician and Strength.',
         'image': _img('symbol-lemniscate', 'A glowing figure-eight of light above a bowed head.', 'Infinity, crowning the adept')},
        {'glyph': '‖', 'slug': 'pillars', 'name': 'The two pillars',
         'text': 'One black, one white — the threshold between opposites, the balance a seeker must pass between. The High Priestess and the Hierophant sit enthroned there.',
         'image': _img('symbol-pillars', 'A black pillar and a white pillar flanking a veiled doorway.', 'The threshold between opposites')},
        # The U+FE0E variation selectors force text (not colour-emoji) presentation
        # — without them Chromium paints ♒, ▲, ☀, ☾ and ♛ in full emoji colour and
        # the motif grid breaks out of the gold monochrome.
        {'glyph': '♒︎', 'slug': 'water', 'name': 'Water',
         'text': 'The subconscious and the flow of feeling. Still pools, rivers, and distant seas mark where emotion and intuition run beneath a scene.',
         'image': _img('symbol-water', 'A still dark pool reflecting a sliver of moon.', 'The current beneath the scene')},
        {'glyph': '▲︎', 'slug': 'mountains', 'name': 'Mountains',
         'text': 'Challenge and permanence — the cold heights of attainment, and the long climb any real achievement asks.',
         'image': _img('symbol-mountains', 'Cold blue peaks rising behind a low plain.', 'The long climb')},
        {'glyph': '☀︎', 'slug': 'sun', 'name': 'The Sun',
         'text': 'Vitality, clarity, and conscious joy; warmth made visible. Where it rises, so does understanding.',
         'image': _img('symbol-sun', 'A radiant sun with a calm human face over a walled garden.', 'Warmth made visible')},
        {'glyph': '☾︎', 'slug': 'moon', 'name': 'The Moon',
         'text': 'Intuition, dream, and illusion — the cyclical, half-lit world of the unconscious, where not everything is as it seems.',
         'image': _img('symbol-moon', 'A crescent moon with a downturned face dripping pale light.', 'The half-lit world')},
        {'glyph': '❀', 'slug': 'roses', 'name': 'Roses & lilies',
         'text': 'Desire and purity — the red rose of passion beside the white lily of thought, the two poles the Magician holds in balance.',
         'image': _img('symbol-roses', 'Red roses and white lilies growing entwined on one trellis.', 'Desire beside purity')},
        {'glyph': '♛︎', 'slug': 'crowns', 'name': 'Crowns & halos',
         'text': 'Sovereignty and higher awareness — a mind or a station raised above the ordinary, sanctioned from above.',
         'image': _img('symbol-crowns', 'A thin gold crown hovering above an empty throne, haloed.', 'Sanctioned from above')},
    ],
    'colors_intro': (
        "Colour is its own language in the deck. A few readings recur so often "
        "they are worth carrying with you:"
    ),
    'colors': [
        {'name': 'Gold', 'swatch': '#C8A24C', 'text': 'Spirit, illumination, the divine — the light of higher understanding.'},
        {'name': 'Red', 'swatch': '#8f3a34', 'text': 'Passion, action, the life force; desire and the vitality of the body.'},
        {'name': 'Blue', 'swatch': '#3f5f86', 'text': 'Intuition, calm, and spirit; the reflective depth of water and sky.'},
        {'name': 'White', 'swatch': '#e8dfc8', 'text': 'Purity and untouched potential — a beginning not yet chosen.'},
        {'name': 'Black', 'swatch': '#1a1c26', 'text': 'Mystery and the unknown; the fertile dark that precedes what has not yet formed.'},
    ],
}

# ── Closing note on how to read ───────────────────────────────────────────────
READING_ETHOS = {
    'title': 'On reading the cards',
    'paragraphs': [
        (
            "There is no single, fixed meaning to any card. A reading is a "
            "conversation between the images, the question, and the person asking "
            "— and the same card will say different things in different company. "
            "Upright or reversed, past position or future, a card beside the Tower "
            "reads unlike the same card beside the Star."
        ),
        (
            "Used well, the tarot is not a way to learn what will happen but a way "
            "to see what is already true. Hold your question lightly, let the image "
            "surprise you, and trust the meaning that rises to meet it. The cards "
            "are here for contemplation and reflection — the wisdom they reveal is "
            "your own."
        ),
    ],
    'image': _img(
        'ethos-band',
        'A wide dim interior with a single card face-up under candlelight.',
        'One card, held lightly',
    ),
}
