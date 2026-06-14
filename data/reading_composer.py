"""
reading_composer.py — narrative composer for tarot readings.

Given the cards drawn for a spread, the spread key, and the querent's typed
question, this builds a short, per-card "narrative" that varies with three
signals:

  1. POSITION  — the role a card plays in the spread (past / present / future /
     challenge / advice / hidden / message) sets the framing and tense.
  2. NEIGHBOURS — the cards touching it on the board contribute at most one
     relational sentence (elemental dignity, a celtic-cross crossing, or a
     repeated rank), so a card is read in the light of its company.
  3. QUESTION  — when the querent typed one, a "lens" sentence ties the card's
     own keywords to the topic they asked about (love / career / money / self /
     health). With no question, that sentence is simply omitted — no faked
     personalisation.

Plus one spread-level `reading_notes` line for whole-reading patterns (mostly
Major Arcana, a dominant suit, many reversals) so those global observations are
said once rather than repeated on every card.

To keep the prose concrete rather than vague, each frame weaves in *two or three
of the card's five keywords*, chosen by a shuffle, so the same position can
surface different facets of a card from one reading to the next. The output stays
deterministic for a given draw: every choice (template variant and keyword
rotation alike) is driven by a PRNG seeded from the drawn cards + question, so
re-rendering the same reading yields the same words while a different reading
reads differently.

This is a pure, dependency-free module: `compose(cards, spread_key, question)`
takes plain dicts and returns plain strings, so it is trivially testable.
"""

import random
import re


# ── Question classification ───────────────────────────────────────────────────
# Shallow keyword match — deliberately conservative. A miss falls through to
# 'general', which omits the lens sentence rather than guessing a wrong topic.
_TOPICS = {
    'love': [
        'love', 'relationship', 'partner', 'boyfriend', 'girlfriend', 'husband',
        'wife', 'spouse', 'crush', 'marriage', 'married', 'ex', 'dating', 'date',
        'romance', 'romantic', 'heart', 'soulmate', 'breakup', 'divorce', 'affair',
    ],
    'career': [
        'job', 'work', 'career', 'boss', 'promotion', 'interview', 'business',
        'company', 'colleague', 'coworker', 'project', 'startup', 'study',
        'studies', 'school', 'degree', 'exam', 'vocation', 'calling', 'role',
    ],
    'money': [
        'money', 'debt', 'finance', 'financial', 'afford', 'invest', 'investment',
        'buy', 'sell', 'salary', 'income', 'savings', 'loan', 'mortgage', 'rent',
        'budget', 'wealth', 'rich', 'poor', 'pay', 'cost', 'price',
    ],
    'self': [
        'myself', 'growth', 'purpose', 'healing', 'confidence', 'habit', 'change',
        'identity', 'fear', 'anxiety', 'depression', 'spiritual', 'soul', 'self',
        'meaning', 'direction', 'stuck', 'lost', 'happy', 'happiness', 'peace',
    ],
    'health': [
        'health', 'energy', 'sleep', 'stress', 'body', 'illness', 'sick',
        'recovery', 'tired', 'exhaustion', 'wellbeing', 'fitness', 'diet',
    ],
}

_DECISION_OPENERS = {
    'should', 'shall', 'will', 'can', 'could', 'would', 'is', 'are', 'am', 'do',
    'does', 'did', 'has', 'have', 'must', 'may',
}
_UNDERSTAND_OPENERS = {'how', 'what', 'why', 'who', 'when', 'where', 'which'}


def classify_question(question):
    """Return (topic, form). topic in _TOPICS keys or 'general'; form in
    {'decision', 'understand', 'open'}."""
    q = (question or '').strip().lower()
    if not q:
        return ('general', 'open')

    words = re.findall(r"[a-z']+", q)
    wordset = set(words)

    # Topic: the lexicon with the most hits wins; ties resolved by _TOPICS order.
    best_topic, best_hits = 'general', 0
    for topic, lexicon in _TOPICS.items():
        hits = sum(1 for w in lexicon if w in wordset)
        if hits > best_hits:
            best_topic, best_hits = topic, hits

    first = words[0] if words else ''
    if first in _UNDERSTAND_OPENERS:
        form = 'understand'
    elif first in _DECISION_OPENERS:
        form = 'decision'
    else:
        form = 'open'

    return (best_topic, form)


# ── Position roles ────────────────────────────────────────────────────────────
# Frame templates per (role, orientation). Each draws on up to three of the
# card's own keywords — {kw}, {kw2}, {kw3} — chosen by a per-card shuffle, so the
# same skeleton reads concretely (real qualities of *this* card) and differently
# from one draw to the next. {name} = card name.
_ROLE_FRAMES = {
    'past': {
        'upright': [
            "{name} is the root of all this — a season of {kw} whose {kw2} still shapes the ground beneath your feet.",
            "Long before the question formed, {name} set things moving: {kw} that hardened into foundation, with {kw2} threaded all through it.",
            "You carry {name} with you — the {kw} of what has already happened, and the {kw2} it taught you, both alive in the present.",
            "What came before wears the face of {name}: {kw} that opened this chapter, {kw2} that closed the last one.",
            "{name} lies behind you, where {kw} once ran strong; its {kw2} is the inheritance you bring into today.",
        ],
        'reversed': [
            "{name} reversed marks an old {kw} you never quite finished — it loosened into {kw2}, and the loose thread still pulls at now.",
            "Behind you, {name} reversed holds {kw} that was buried rather than healed; {kw2} is the residue it left.",
            "The root here is {name} reversed: {kw} that went unspoken, {kw2} set aside and only now asking to be faced.",
            "{name} reversed shows where the past snagged — {kw} curdled into {kw2}, a knot tied long ago and never worked loose.",
            "What set this in motion was {name} reversed; its {kw} soured into {kw2}, and you have been carrying the weight since.",
        ],
    },
    'present': {
        'upright': [
            "Right now you stand inside {name}: {kw} is the air you are breathing, {kw2} the ground you walk on.",
            "{name} is the truth of this moment — {kw} alive and unmistakable, edged with {kw2}.",
            "Today turns on {name}. What it asks of you is {kw}; what it offers in return is {kw2}.",
            "The present wears {name} openly — {kw} moving through everything, {kw2} just beneath the surface.",
            "Here and now, {name} sets the tone: a clear note of {kw}, deepened by {kw2}.",
        ],
        'reversed': [
            "{name} reversed sits at the centre now — {kw} stalled or turned inward, {kw2} you have not fully claimed.",
            "Today carries {name} reversed: {kw} blocked at the source, {kw2} leaking out where you least expect it.",
            "Right now {name} reversed colours things — {kw} and {kw2} tangled together, and you can feel the friction.",
            "The present holds {name} reversed: {kw} held back, {kw2} working under the surface of the day.",
            "At the heart of it now is {name} reversed — {kw} out of true, {kw2} asking to be set right.",
        ],
    },
    'future': {
        'upright': [
            "Keep to this path and it ripens into {name}: {kw} coming into its own, {kw2} close behind.",
            "Ahead lies {name} — the road bends toward {kw}, and {kw2} waits at the turn.",
            "{name} is what forms on the horizon: {kw} you can grow toward, {kw2} you can count on.",
            "If today's course holds, tomorrow wears {name} — {kw} ripening, {kw2} as its reward.",
            "The future tilts toward {name}: expect {kw}, and let {kw2} be the shape it finally takes.",
        ],
        'reversed': [
            "Left unchanged, the road leads to {name} reversed — {kw} arriving late or warped, {kw2} slipping out of reach.",
            "{name} reversed waits ahead: {kw} that may sour into {kw2} unless something shifts first.",
            "Ahead lies {name} reversed — a future where {kw} stalls and {kw2} goes unmet, though nothing here is fixed yet.",
            "If the present holds its course, {name} reversed is the cost: {kw} deferred, {kw2} half-formed.",
            "The horizon shows {name} reversed — {kw} you will have to wrestle with, {kw2} that will not come easily.",
        ],
    },
    'challenge': {
        'upright': [
            "{name} stands in your way — {kw} you cannot go around, only through, with {kw2} as the test inside it.",
            "The obstacle is {name}: {kw} planted squarely across your path, {kw2} the lesson hidden in it.",
            "What crosses you here is {name} — meet its {kw} head-on and its {kw2} stops being an enemy.",
            "{name} marks the friction: {kw} pressing against you now, {kw2} the very thing it is pressing you toward.",
            "Your work is {name} — the {kw} of it resists you, but its {kw2} is exactly what you are being asked to find.",
        ],
        'reversed': [
            "{name} reversed is the snag — {kw} working against you from an angle you cannot quite see, dressed up as {kw2}.",
            "What crosses you is {name} reversed: {kw} that hides its shape, {kw2} slipping away the moment you name it.",
            "The obstacle is {name} reversed — {kw} turned inward, {kw2} that must be drawn into the light before it lets go.",
            "{name} reversed blocks the way quietly: {kw} you have been avoiding, {kw2} you have been calling something else.",
            "The harder challenge is {name} reversed — its {kw} will not be faced head-on, and its {kw2} resists every easy answer.",
        ],
    },
    'advice': {
        'upright': [
            "Lead with {name}: let {kw} set your pace and {kw2} steady your hand.",
            "The way through is {name} — choose {kw} where you have been choosing fear, and let {kw2} carry the rest.",
            "{name} points the way: act from {kw}, and trust {kw2} to meet you halfway.",
            "Take up {name} here — {kw} is the move, {kw2} the manner to make it in.",
            "Your next step is {name}: lean into {kw}, hold to {kw2}, and the path opens.",
        ],
        'reversed': [
            "{name} reversed counsels restraint — check your {kw} before you act, and watch where it tips into {kw2}.",
            "Step carefully: {name} reversed warns against {kw}, and against the {kw2} that comes dressed as virtue.",
            "The advice is {name} reversed — hold back the {kw} you are tempted to force, and beware {kw2}.",
            "{name} reversed says wait: too much {kw} here curdles into {kw2}; let it settle first.",
            "Guard against {kw} as you choose — {name} reversed shows how quickly it turns to {kw2}.",
        ],
    },
    'hidden': {
        'upright': [
            "Beneath the surface runs {name} — {kw} you have not named yet, {kw2} quietly steering more than you know.",
            "Out of sight, {name} is at work: {kw} moving under everything, {kw2} surfacing only in glimpses.",
            "{name} is the undercurrent here — {kw} you feel before you see, {kw2} shaping the room from the shadows.",
            "What is hidden wears {name}: {kw} running below the visible, {kw2} the secret engine of it all.",
            "Underneath it all sits {name} — {kw} unspoken, {kw2} waiting for you to notice.",
        ],
        'reversed': [
            "{name} reversed stirs in the dark — {kw} you have pushed down, {kw2} that wants out whether you allow it or not.",
            "Hidden here is {name} reversed: {kw} denied, {kw2} kept just out of view and quietly costing you.",
            "Below the surface, {name} reversed holds {kw} you will not look at and {kw2} you have been refusing to feel.",
            "{name} reversed is the buried note — {kw} repressed, {kw2} leaking through in ways you have not traced.",
            "What is truly going on is {name} reversed: {kw} withheld, {kw2} working against you from underneath.",
        ],
    },
    'message': {
        'upright': [
            "Your answer is {name}: {kw}, plainly — and {kw2} as the way to live it out.",
            "{name} comes as the single word for all of this — {kw}, carried by {kw2}.",
            "To what you asked, {name} replies with {kw}, and points you toward {kw2}.",
            "The one card is {name}: take it as {kw}, and let {kw2} be how you answer.",
            "{name} is the whole of it — {kw} at the centre, {kw2} as its echo.",
        ],
        'reversed': [
            "Your answer is {name} reversed: sit with {kw}, and be honest about the {kw2} underneath it.",
            "{name} reversed is the reply — not a no, but a {kw} that asks you to weigh {kw2} first.",
            "To what you asked, {name} reversed offers {kw} turned inward, with {kw2} as the caution.",
            "The single card is {name} reversed: {kw} you are not yet ready for, {kw2} you will need to face.",
            "{name} reversed answers with {kw} — a note bent inward, shadowed by {kw2}.",
        ],
    },
}


# ── Topic lens templates ──────────────────────────────────────────────────────
# A second sentence tying one of the card's keywords to the asked topic. Split by
# form so a yes/no question reads as counsel and a how/why question as insight.
# Phrasing is deliberately *valence-neutral* — it names the keyword as what is at
# stake rather than what to "lean on" — so it reads correctly whether the drawn
# keyword is bright (an upright card) or shadowed (a reversed one).
_TOPIC_LENS = {
    'love': {
        'decision': [
            "In matters of the heart, this turns on {kw} more than anything.",
            "For this bond, {kw} is the thread to watch as you decide.",
            "Where love is the question, {kw} is what tips the balance.",
        ],
        'understand': [
            "In love, this points straight at {kw} as the heart of what you are feeling.",
            "Where the heart is concerned, {kw} is what the card lays bare.",
            "For this relationship, {kw} is the truth moving underneath it.",
        ],
    },
    'career': {
        'decision': [
            "In the work you are weighing, {kw} is the deciding factor.",
            "For this path, the choice turns on {kw}.",
            "Where your work is the question, {kw} is what to weigh first.",
        ],
        'understand': [
            "In your work, this reveals {kw} as the real force in play.",
            "Where your vocation is concerned, {kw} is what the card names.",
            "For the work itself, {kw} is the current beneath the surface.",
        ],
    },
    'money': {
        'decision': [
            "On the material question, {kw} is what should tip the scales.",
            "Where money is at stake, the decision turns on {kw}.",
            "For this question of means, {kw} is the factor to weigh.",
        ],
        'understand': [
            "In matters of money, this surfaces {kw} as the real current.",
            "On the financial question, {kw} is what the card lays bare.",
            "Where resources are concerned, {kw} is what is actually at work.",
        ],
    },
    'self': {
        'decision': [
            "On your own path, this comes down to {kw}.",
            "For the growth you are reaching toward, {kw} is what the choice rests on.",
            "Where you are the question, {kw} is the deciding thread.",
        ],
        'understand': [
            "Within you, this points to {kw} as the thing stirring.",
            "On the inner question, {kw} is what the card brings to light.",
            "For your own becoming, {kw} is the truth underneath.",
        ],
    },
    'health': {
        'decision': [
            "For your wellbeing, {kw} is what the decision turns on.",
            "Where your energy is concerned, {kw} is the factor to weigh.",
            "For the body's question, {kw} is what to watch as you choose.",
        ],
        'understand': [
            "In the body and its energy, this names {kw} as what is at work.",
            "On the question of health, {kw} is what the card reveals.",
            "For your vitality, {kw} is the current to watch.",
        ],
    },
}


# ── Elemental dignity ─────────────────────────────────────────────────────────
_SUPPORT = {('Fire', 'Air'), ('Air', 'Fire'), ('Water', 'Earth'), ('Earth', 'Water')}
_FRICTION = {('Fire', 'Water'), ('Water', 'Fire'), ('Air', 'Earth'), ('Earth', 'Air')}


def _dignity(elem_a, elem_b):
    """Classical elemental dignity between two elements."""
    if not elem_a or not elem_b:
        return 'neutral'
    if elem_a == elem_b:
        return 'same'
    pair = (elem_a, elem_b)
    if pair in _SUPPORT:
        return 'support'
    if pair in _FRICTION:
        return 'friction'
    return 'neutral'


# ── Adjacency per spread (index → list of neighbour indices) ───────────────────
# Mirrors the on-board geometry so a card is read against the cards it touches.
_ADJACENCY = {
    'single': {0: []},
    'three_card': {0: [1], 1: [0, 2], 2: [1]},
    'five_card': {0: [1, 2, 3, 4], 1: [0], 2: [0], 3: [0], 4: [0]},
    'horseshoe': {0: [1], 1: [0, 2], 2: [1, 3], 3: [2, 4], 4: [3, 5], 5: [4, 6], 6: [5]},
    'celtic_cross': {
        0: [1, 2, 3, 4, 5], 1: [0], 2: [0], 3: [0], 4: [0],
        5: [0, 9], 6: [7], 7: [6, 8], 8: [7, 9], 9: [8, 5],
    },
}

# The celtic cross's first two cards are the privileged "crossing" pair.
_CROSSING_PAIRS = {'celtic_cross': (0, 1)}


# ── Relational sentence banks ──────────────────────────────────────────────────
# Each takes (other_name, other_position); the "same"/rank banks take their own
# args. Multiple phrasings per relation so neighbouring readings don't repeat.
_REL_FRICTION = [
    "%s in the %s pulls against it — expect crosscurrents where the two meet.",
    "It runs up against %s in the %s; the two do not agree, and that tension is real.",
    "%s in the %s works at cross-purposes with it, so progress here may feel like wading upstream.",
]
_REL_SUPPORT = [
    "%s in the %s lends it strength; the two move easily together.",
    "It finds an ally in %s in the %s — they reinforce one another.",
    "%s in the %s flows with it, smoothing the way forward.",
]
_REL_SAME = [  # args: (other_name, element_lower)
    "Echoed by %s, another %s influence, the theme only deepens.",
    "%s sounds the same %s note, and the doubling is hard to ignore.",
    "With %s carrying the same %s charge, the spread keeps circling one current.",
]
_REL_CROSS_FRICTION = [
    "It is crossed by %s in the %s — the two pull hard against each other, and that strain is the crux of the matter.",
    "%s in the %s lies straight across it; their clash is what this whole reading turns on.",
]
_REL_CROSS_SUPPORT = [
    "It is crossed by %s in the %s, yet the two are kin — what looks like an obstacle may be an ally.",
    "%s crosses it from the %s, but they are of one mind; the block is gentler than it looks.",
]
_REL_CROSS_NEUTRAL = [
    "It is crossed by %s in the %s, the one pressure this whole reading turns upon.",
    "%s in the %s cuts clean across it — the single tension everything else circles.",
]
_REL_RANK = [  # args: (rank,)
    "And it does not stand alone — the %s repeats in this spread, doubling its weight.",
    "The %s shows up more than once here, and the repetition is not idle.",
]


# ── Suit domains for the spread-level note ─────────────────────────────────────
_SUIT_DOMAIN = {
    'Wands': 'energy, drive, and the will to create',
    'Cups': 'feeling, love, and connection',
    'Swords': 'thought, truth, and conflict',
    'Pentacles': 'work, money, and the material world',
}

# Whole-reading observation banks (said once, picked by the seeded rng).
_NOTE_MAJORS = [
    "More than half these cards are Major Arcana — forces larger than everyday choice are at work here.",
    "The Major Arcana dominate this spread; what is unfolding runs deeper than ordinary day-to-day matters.",
]
_NOTE_SUIT = [  # args: (suit, domain)
    "The suit of %s runs through the spread, marking %s as where the real movement lies.",
    "%s appears again and again here — %s is where this reading is truly pointing.",
]
_NOTE_REVERSED = [
    "So many cards fall reversed that much of this reading turns inward — blocked, withheld, or not yet ready to surface.",
    "With most cards reversed, the energy here is held back or turned inward, waiting to be released.",
]


# ── Keyword nominalisation for prose ──────────────────────────────────────────
# Every frame and lens template drops a keyword into a NOUN slot ("the {kw} of
# it", "a season of {kw}", "{kw} is the air you are breathing"). Most keywords are
# already nouns, but the court cards (and a few reversed lists) carry adjectives —
# 'direct', 'honest', 'driven' — which render as broken prose ("the direct of it
# resists you"). Map those to a bare-noun form (NO leading article, so "a season
# of {kw}" doesn't double up). Keywords absent here pass through unchanged. This
# only affects the composed narrative; the deck and detail pages still show the
# original keyword labels, where an adjective reads perfectly well.
_NOMINALIZE = {
    'direct': 'directness',
    'driven': 'drive',
    'assertive': 'assertiveness',
    'independent': 'independence',
    'perceptive': 'perception',
    'honest': 'honesty',
    'reckless': 'recklessness',
    'aggressive': 'aggression',
    'domineering': 'domination',
    'blunt': 'bluntness',
    'destructive': 'destruction',
    'adventurous': 'adventurousness',
    'scattered': 'scattered energy',
    'hot-headed': 'hot-headedness',
    'unrealistic': 'unreality',
    'emotionally manipulative': 'emotional manipulation',
    'down-to-earth': 'groundedness',
    'stuck': 'inertia',
    'lost': 'disorientation',
    'entrepreneur': 'enterprise',
}


def _nominalize(kw):
    """Noun form of a keyword for use mid-sentence (adjectives → nouns)."""
    return _NOMINALIZE.get(kw, kw)


def _orient_keywords(card):
    """Keyword list matching the card's orientation, nominalised so each reads as
    a noun when spliced into a prose slot."""
    if card.get('reversed'):
        kws = card.get('keywords_reversed') or card.get('keywords_upright') or []
    else:
        kws = card.get('keywords_upright') or []
    return [_nominalize(k) for k in kws]


def _three_keywords(rng, card):
    """Three keywords from the card, shuffled so a given card surfaces different
    facets across draws. Pads by repetition if the card has fewer than three."""
    kws = list(_orient_keywords(card))
    if not kws:
        return ('change', 'change', 'change')
    picks = kws[:]
    rng.shuffle(picks)
    while len(picks) < 3:
        picks.append(picks[len(picks) % len(kws)])
    return (picks[0], picks[1], picks[2])


def _pick(rng, options, used):
    """Pick an option, avoiding ones already used in this reading when possible
    so repeated roles (e.g. several 'present' cards in the celtic cross) don't
    echo the same sentence."""
    fresh = [o for o in options if o not in used]
    choice = rng.choice(fresh if fresh else options)
    used.add(choice)
    return choice


def _seed(cards, spread_key, question):
    parts = [spread_key, (question or '').strip().lower()]
    for c in cards:
        parts.append('%s:%s' % (c.get('id'), 1 if c.get('reversed') else 0))
    return hash('|'.join(str(p) for p in parts)) & 0xFFFFFFFF


def _frame_sentence(rng, card, role, used):
    orientation = 'reversed' if card.get('reversed') else 'upright'
    bank = _ROLE_FRAMES.get(role, _ROLE_FRAMES['message'])[orientation]
    template = _pick(rng, bank, used)
    kw, kw2, kw3 = _three_keywords(rng, card)
    return template.format(name=card.get('name', 'this card'), kw=kw, kw2=kw2, kw3=kw3)


def _lens_sentence(rng, card, topic, form, used):
    if topic == 'general':
        return ''
    by_form = _TOPIC_LENS.get(topic)
    if not by_form:
        return ''
    bank = by_form.get(form) or by_form.get('understand')
    # Only use a phrasing not yet spent in this reading. Once they are all used
    # (e.g. a 10-card spread outruns the three templates), fall silent rather than
    # drone the same line on card after card — the frame still carries each card.
    fresh = [t for t in bank if t not in used]
    if not fresh:
        return ''
    template = rng.choice(fresh)
    used.add(template)
    kws = _orient_keywords(card)
    kw = rng.choice(kws) if kws else 'what stirs'
    return template.format(kw=kw)


def _relation_sentence(rng, idx, cards, spread_key, rank_first):
    """At most one relational sentence: the highest-priority feature among this
    card's neighbours. Priority: crossing > friction > support > same > rank."""
    card = cards[idx]
    neighbours = _ADJACENCY.get(spread_key, {}).get(idx, [])
    elem = card.get('element')

    crossing = _CROSSING_PAIRS.get(spread_key)
    best = None  # (priority, sentence)

    def consider(priority, sentence):
        nonlocal best
        if best is None or priority < best[0]:
            best = (priority, sentence)

    for n in neighbours:
        if n >= len(cards):
            continue
        other = cards[n]
        other_name = other.get('name', 'another card')
        # Strip a leading "the " so "in the {pos}" doesn't double up the article
        # for positions like "The Challenge" → "in the challenge".
        other_pos = re.sub(r'^the\s+', '', (other.get('position') or '').lower())
        rel = _dignity(elem, other.get('element'))

        is_crossing = crossing and idx in crossing and n in crossing
        if is_crossing:
            if rel == 'friction':
                consider(0, rng.choice(_REL_CROSS_FRICTION) % (other_name, other_pos))
            elif rel == 'support':
                consider(0, rng.choice(_REL_CROSS_SUPPORT) % (other_name, other_pos))
            else:
                consider(0, rng.choice(_REL_CROSS_NEUTRAL) % (other_name, other_pos))
            continue

        if rel == 'friction':
            consider(1, rng.choice(_REL_FRICTION) % (other_name, other_pos))
        elif rel == 'support':
            consider(2, rng.choice(_REL_SUPPORT) % (other_name, other_pos))
        elif rel == 'same':
            consider(3, rng.choice(_REL_SAME) % (other_name, (elem or '').lower()))

    # Rank echo is lowest priority and only annotates the first card of the echo.
    if rank_first.get(idx):
        consider(4, rng.choice(_REL_RANK) % str(card.get('number')))

    return best[1] if best else ''


def _reading_notes(rng, cards):
    """Whole-reading observations, said once. Returns a short string (possibly
    empty)."""
    n = len(cards)
    if n <= 1:
        return ''

    notes = []

    majors = sum(1 for c in cards if c.get('arcana') == 'major')
    if majors > n / 2:
        notes.append(rng.choice(_NOTE_MAJORS))

    minors = [c for c in cards if c.get('arcana') == 'minor']
    if minors:
        counts = {}
        for c in minors:
            s = c.get('suit')
            if s:
                counts[s] = counts.get(s, 0) + 1
        if counts:
            suit, cnt = max(counts.items(), key=lambda kv: kv[1])
            if cnt >= 3 and cnt >= len(minors) / 2:
                domain = _SUIT_DOMAIN.get(suit, 'this suit')
                notes.append(rng.choice(_NOTE_SUIT) % (suit, domain))

    reversed_count = sum(1 for c in cards if c.get('reversed'))
    if reversed_count >= 3 and reversed_count >= 0.6 * n:
        notes.append(rng.choice(_NOTE_REVERSED))

    # Keep it to two observations at most so the note stays a note.
    return ' '.join(notes[:2])


def compose(cards, spread_key, question=''):
    """Build narratives for a drawn reading.

    `cards` is the ordered list of drawn-card dicts (each carrying at least
    id, name, number, arcana, suit, element, reversed, position, and the
    keyword lists). Returns {'narratives': [str, ...], 'reading_notes': str}.
    """
    cards = list(cards or [])
    if not cards:
        return {'narratives': [], 'reading_notes': ''}

    topic, form = classify_question(question)
    rng = random.Random(_seed(cards, spread_key, question))

    positions = SPREAD_ROLES.get(spread_key)

    # Pre-compute which card is the *first* occurrence of a repeated rank, so the
    # rank-echo line is attached once rather than on every matching card.
    rank_first = {}
    seen_rank = {}
    rank_total = {}
    for c in cards:
        r = c.get('number')
        rank_total[r] = rank_total.get(r, 0) + 1
    for i, c in enumerate(cards):
        r = c.get('number')
        if rank_total.get(r, 0) >= 2 and r not in seen_rank:
            rank_first[i] = True
            seen_rank[r] = True

    used_frames, used_lens = set(), set()
    narratives = []
    for i, card in enumerate(cards):
        role = 'message'
        if positions and i < len(positions):
            role = positions[i].get('role', 'present')
        elif spread_key == 'single':
            role = 'message'

        parts = [_frame_sentence(rng, card, role, used_frames)]
        lens = _lens_sentence(rng, card, topic, form, used_lens)
        if lens:
            parts.append(lens)
        relation = _relation_sentence(rng, i, cards, spread_key, rank_first)
        if relation:
            parts.append(relation)

        narratives.append(' '.join(parts))

    return {'narratives': narratives, 'reading_notes': _reading_notes(rng, cards)}


# Populated by tarot_data after SPREADS is defined, to avoid a circular import at
# module load. Maps spread_key → its ordered positions list (each carrying role).
SPREAD_ROLES = {}


def register_spread_roles(spreads):
    """Wire in the SPREADS dict (called once from tarot_data) so compose() can
    read each position's role without importing tarot_data at module top."""
    SPREAD_ROLES.clear()
    for key, spread in spreads.items():
        SPREAD_ROLES[key] = spread.get('positions', [])
