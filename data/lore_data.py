# lore_data.py
# Editorial content for the "Lore" section — the history and symbolism of tarot.
# This is the single source of truth for the /lore page, mirroring how
# tarot_data.py holds the card data. Content is structured (not free HTML) so the
# template stays presentational and the copy stays easy to edit and test.

# ── Framing ───────────────────────────────────────────────────────────────────
LORE_INTRO = (
    "Long before it was an oracle, the tarot was a game. Its seventy-eight cards "
    "carry six centuries of accumulated meaning — a visual language of archetype "
    "and symbol assembled from Renaissance courts, esoteric revival, and a "
    "century of artists reading their own lives into the images. What follows is "
    "a short field-guide to where the cards came from and how to read what they "
    "show."
)

# ── History & origins ─────────────────────────────────────────────────────────
# An ordered timeline. Each entry: era label, title, and a paragraph of context.
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
    },
    {
        'era': '1909',
        'title': 'The Rider–Waite–Smith deck',
        'text': (
            "Working from the teachings of the Hermetic Order of the Golden Dawn, "
            "the scholar A. E. Waite and the artist Pamela Colman Smith created "
            "the deck that would define modern tarot. Its quiet revolution was the "
            "minor arcana: for the first time every pip card carried a full scene, "
            "not just an arrangement of suit symbols, giving the whole deck a "
            "readable narrative. Nearly every deck since is drawn in its shadow."
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
    },
]

# ── Numerology of the pips and courts ─────────────────────────────────────────
NUMEROLOGY = {
    'intro': (
        "Within each suit, the number or rank marks a stage — a moment in the arc "
        "from first spark to fulfilment. The suit says which part of life; the "
        "number says where along its path you stand."
    ),
    'pips': [
        {'rank': 'Ace', 'title': 'The seed', 'text': 'Pure potential — the suit’s gift, offered whole and unspent.'},
        {'rank': 'Two', 'title': 'Balance', 'text': 'Duality and choice; partnership, tension, the meeting of two.'},
        {'rank': 'Three', 'title': 'Growth', 'text': 'The first fruits — creation, collaboration, early increase.'},
        {'rank': 'Four', 'title': 'Structure', 'text': 'Stability and rest; a foundation set, for better or for stasis.'},
        {'rank': 'Five', 'title': 'Disruption', 'text': 'Conflict, loss, or challenge — the change that breaks the four.'},
        {'rank': 'Six', 'title': 'Harmony', 'text': 'Balance restored, reciprocity, movement gently forward.'},
        {'rank': 'Seven', 'title': 'Reflection', 'text': 'Assessment and perseverance; faith and effort put to the test.'},
        {'rank': 'Eight', 'title': 'Momentum', 'text': 'Mastery in motion — swift progress, focus, power applied.'},
        {'rank': 'Nine', 'title': 'Intensity', 'text': 'Near-fulfilment; the suit at its fullest pitch, for good or ill.'},
        {'rank': 'Ten', 'title': 'Completion', 'text': 'The cycle’s end and overflow — and the seed of the next.'},
    ],
    'courts': [
        {'rank': 'Page', 'title': 'The student', 'text': 'A beginner and messenger — the suit’s energy newly awakened, curious and unformed.'},
        {'rank': 'Knight', 'title': 'The seeker', 'text': 'The suit in motion and pursuit, driven and single-minded, sometimes to excess.'},
        {'rank': 'Queen', 'title': 'The keeper', 'text': 'Inner mastery — one who embodies and nurtures the suit’s power from within.'},
        {'rank': 'King', 'title': 'The sovereign', 'text': 'Outer mastery — authority, command, and the suit wielded in the world.'},
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
        {'glyph': '∞', 'name': 'The lemniscate', 'text': 'The sideways figure-eight of infinity — boundless energy and eternal renewal, crowning the Magician and Strength.'},
        {'glyph': '‖', 'name': 'The two pillars', 'text': 'One black, one white — the threshold between opposites, the balance a seeker must pass between. The High Priestess and the Hierophant sit enthroned there.'},
        {'glyph': '♒', 'name': 'Water', 'text': 'The subconscious and the flow of feeling. Still pools, rivers, and distant seas mark where emotion and intuition run beneath a scene.'},
        {'glyph': '▲', 'name': 'Mountains', 'text': 'Challenge and permanence — the cold heights of attainment, and the long climb any real achievement asks.'},
        {'glyph': '☀', 'name': 'The Sun', 'text': 'Vitality, clarity, and conscious joy; warmth made visible. Where it rises, so does understanding.'},
        {'glyph': '☾', 'name': 'The Moon', 'text': 'Intuition, dream, and illusion — the cyclical, half-lit world of the unconscious, where not everything is as it seems.'},
        {'glyph': '❀', 'name': 'Roses & lilies', 'text': 'Desire and purity — the red rose of passion beside the white lily of thought, the two poles the Magician holds in balance.'},
        {'glyph': '♛', 'name': 'Crowns & halos', 'text': 'Sovereignty and higher awareness — a mind or a station raised above the ordinary, sanctioned from above.'},
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
}
