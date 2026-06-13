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

The output is deterministic for a given draw: the variant chosen in each slot is
picked by a PRNG seeded from the drawn cards + question, so re-rendering the same
reading yields the same words, while a different reading reads differently.

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
# Frame templates per (role, orientation). The card's keyword (drawn from the
# orientation-appropriate keyword list) carries the up/reversed colour, so the
# same skeleton reads brighter upright and heavier reversed. {name}=card name,
# {kw}/{kw2}=keywords, {pos}=position name (lower-cased).
_ROLE_FRAMES = {
    'past': {
        'upright': [
            "Behind the question stands {name}: {kw} that has already shaped the ground you stand on.",
            "{name} marks what has been at work here — a current of {kw} still echoing forward into now.",
            "What brought you to this point wears the face of {name}, its {kw} laid down like foundation stone.",
        ],
        'reversed': [
            "Behind you, {name} reversed lingers — {kw} that was never fully resolved and still tugs at the present.",
            "{name} reversed marks the root of it: {kw} left unfinished in the past, quietly colouring all that follows.",
            "What set this in motion was {name} reversed, its {kw} a knot that was tied long ago and never loosened.",
        ],
    },
    'present': {
        'upright': [
            "Right now, {name} holds the centre — {kw} is the live current running through your situation.",
            "Where you stand today, {name} speaks plainly of {kw}, the truest note in this moment.",
            "The heart of it now is {name}: {kw} colouring how things actually stand.",
        ],
        'reversed': [
            "Right now, {name} reversed sits at the centre — {kw} is the friction colouring this moment.",
            "Where you stand today, {name} reversed points to {kw}, something turned inward or not yet owned.",
            "The heart of it now is {name} reversed: {kw} working beneath the surface of the present.",
        ],
    },
    'future': {
        'upright': [
            "If the present course holds, {name} is what ripens ahead — a turn toward {kw}.",
            "The road from here bends toward {name}: {kw} is the shape the future is taking.",
            "Ahead lies {name}, and with it {kw} — the likely fruit of the path you are on.",
        ],
        'reversed': [
            "If nothing shifts, {name} reversed waits ahead — {kw} arriving distorted, delayed, or half-formed.",
            "The road from here tilts toward {name} reversed: {kw}, unless the present course is corrected.",
            "Ahead, {name} reversed hints at {kw} — a future still unsettled, its outcome not yet fixed.",
        ],
    },
    'challenge': {
        'upright': [
            "What crosses you here is {name}: {kw} is the tension you are being asked to reckon with.",
            "The obstacle takes the form of {name} — {kw} standing squarely in your path.",
            "{name} marks the friction in this reading: {kw} is what must be met rather than avoided.",
        ],
        'reversed': [
            "What crosses you is {name} reversed — {kw} working against you from an unexpected angle.",
            "The obstacle is {name} reversed: {kw}, all the harder to name because it hides its shape.",
            "{name} reversed is the snag here — {kw} that resists being faced head-on.",
        ],
    },
    'advice': {
        'upright': [
            "The counsel of the cards is {name}: lead with {kw}.",
            "{name} offers the way through — let {kw} guide your next move.",
            "Here the cards advise {name}: meet this with {kw} and the path opens.",
        ],
        'reversed': [
            "The cards counsel caution through {name} reversed: beware {kw} as you choose.",
            "{name} reversed advises restraint — guard against {kw} before you act.",
            "Here the guidance is {name} reversed: the warning is {kw}; step carefully.",
        ],
    },
    'hidden': {
        'upright': [
            "Beneath the surface moves {name} — {kw} working quietly, not yet in plain sight.",
            "Out of view, {name} shapes things: {kw} is the undercurrent you may not have named.",
            "{name} marks what is hidden here — {kw}, felt more than seen.",
        ],
        'reversed': [
            "Beneath the surface, {name} reversed stirs — {kw} repressed, denied, or kept just out of view.",
            "Hidden in this reading is {name} reversed: {kw}, a thing held under that wants to rise.",
            "{name} reversed marks the buried note — {kw}, waiting in the dark to be acknowledged.",
        ],
    },
    'message': {
        'upright': [
            "The cards answer with {name}: {kw} is the single insight offered for your question.",
            "{name} is the message — let {kw} be the thread you follow from here.",
            "For what you asked, the card is {name}: {kw}, plainly and without hedging.",
        ],
        'reversed': [
            "The cards answer with {name} reversed: {kw} is what they ask you to sit with.",
            "{name} reversed is the message — the caution is {kw}; weigh it honestly.",
            "For what you asked, the card is {name} reversed: {kw}, a note turned inward.",
        ],
    },
}


# ── Topic lens templates ──────────────────────────────────────────────────────
# A second sentence tying the card's keyword to the asked topic. Split by form
# so a yes/no question reads as counsel and a how/why question reads as insight.
_TOPIC_LENS = {
    'love': {
        'decision': [
            "In matters of the heart, let {kw} be your measure here.",
            "For this relationship, {kw} is the thread worth following.",
        ],
        'understand': [
            "In love, this points to {kw} as the heart of what you are feeling.",
            "Where the heart is concerned, {kw} is what this card illuminates.",
        ],
    },
    'career': {
        'decision': [
            "In the work you are weighing, {kw} is the quality to lean on.",
            "For this path of work, let {kw} steer the decision.",
        ],
        'understand': [
            "In your work, this reveals {kw} as the force in play.",
            "Where your vocation is concerned, {kw} is what the card names.",
        ],
    },
    'money': {
        'decision': [
            "On the material question, let {kw} temper your choice.",
            "Where money is at stake, {kw} is the note to heed.",
        ],
        'understand': [
            "In matters of money, this surfaces {kw} as the real current.",
            "On the financial question, {kw} is what the card lays bare.",
        ],
    },
    'self': {
        'decision': [
            "On your own path, let {kw} be the compass.",
            "For the growth you are reaching toward, {kw} is the work.",
        ],
        'understand': [
            "Within yourself, this points to {kw} as the thing stirring.",
            "On the inner question, {kw} is what the card brings to light.",
        ],
    },
    'health': {
        'decision': [
            "For your wellbeing, let {kw} guide what you tend to next.",
            "Where your energy is concerned, {kw} is the note to honour.",
        ],
        'understand': [
            "In the body and its energy, this names {kw} as what is at work.",
            "On the question of health, {kw} is what the card reveals.",
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


# ── Suit domains for the spread-level note ─────────────────────────────────────
_SUIT_DOMAIN = {
    'Wands': 'energy, drive, and the will to create',
    'Cups': 'feeling, love, and connection',
    'Swords': 'thought, truth, and conflict',
    'Pentacles': 'work, money, and the material world',
}

# Negative-leaning keywords, used only to sense a past→future tonal flip.
_NEGATIVE_HINTS = {
    'loss', 'grief', 'fear', 'conflict', 'defeat', 'betrayal', 'despair',
    'anxiety', 'heartbreak', 'endings', 'destruction', 'chaos', 'bondage',
    'addiction', 'hardship', 'poverty', 'isolation', 'exhaustion', 'burnout',
    'stagnation', 'restriction', 'delays', 'setback', 'sorrow', 'regret',
}


def _orient_keywords(card):
    """Keyword list matching the card's orientation."""
    if card.get('reversed'):
        return card.get('keywords_reversed') or card.get('keywords_upright') or []
    return card.get('keywords_upright') or []


def _valence(card):
    """Rough negative/positive lean of a card: reversed and negative keywords
    push negative. Returns a small signed int."""
    score = 0
    if card.get('reversed'):
        score -= 1
    kws = set(k.lower() for k in _orient_keywords(card))
    if kws & _NEGATIVE_HINTS:
        score -= 1
    else:
        score += 1
    return score


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
    kws = _orient_keywords(card)
    kw = kws[0] if kws else 'change'
    kw2 = kws[1] if len(kws) > 1 else kw
    return template.format(name=card.get('name', 'this card'), kw=kw, kw2=kw2)


def _lens_sentence(rng, card, topic, form, used):
    if topic == 'general':
        return ''
    by_form = _TOPIC_LENS.get(topic)
    if not by_form:
        return ''
    bank = by_form.get(form) or by_form.get('understand')
    template = _pick(rng, bank, used)
    kws = _orient_keywords(card)
    # Prefer the second keyword so the lens doesn't echo the frame's first one.
    kw = (kws[1] if len(kws) > 1 else (kws[0] if kws else 'what stirs'))
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
                consider(0, "It is crossed by %s in the %s — the two pull hard against each other, and that strain is the crux of the matter." % (other_name, other_pos))
            elif rel == 'support':
                consider(0, "It is crossed by %s in the %s, yet the two are kin; what looks like obstacle may in fact be ally." % (other_name, other_pos))
            else:
                consider(0, "It is crossed by %s in the %s, the one pressure this whole reading turns upon." % (other_name, other_pos))
            continue

        if rel == 'friction':
            consider(1, "%s in the %s pulls against it — expect crosscurrents where the two meet." % (other_name, other_pos))
        elif rel == 'support':
            consider(2, "%s in the %s lends it strength; the two elements move easily together." % (other_name, other_pos))
        elif rel == 'same':
            consider(3, "Echoed by %s, another %s influence, the theme only deepens." % (other_name, (elem or '').lower()))

    # Rank echo is lowest priority and only annotates the first card of the echo.
    if rank_first.get(idx):
        rank = card.get('number')
        consider(4, "And it does not stand alone — the %s repeats in this spread, doubling its weight." % str(rank))

    return best[1] if best else ''


def _reading_notes(cards):
    """Whole-reading observations, said once. Returns a short string (possibly
    empty)."""
    n = len(cards)
    if n <= 1:
        return ''

    notes = []

    majors = sum(1 for c in cards if c.get('arcana') == 'major')
    if majors > n / 2:
        notes.append("More than half these cards are Major Arcana — forces larger than everyday choice are at work in this reading.")

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
                notes.append("The suit of %s runs through the spread, marking %s as where the real movement lies." % (suit, domain))

    reversed_count = sum(1 for c in cards if c.get('reversed'))
    if reversed_count >= 3 and reversed_count >= 0.6 * n:
        notes.append("So many cards fall reversed that much of this reading turns inward — blocked, withheld, or not yet ready to surface.")

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

    return {'narratives': narratives, 'reading_notes': _reading_notes(cards)}


# Populated by tarot_data after SPREADS is defined, to avoid a circular import at
# module load. Maps spread_key → its ordered positions list (each carrying role).
SPREAD_ROLES = {}


def register_spread_roles(spreads):
    """Wire in the SPREADS dict (called once from tarot_data) so compose() can
    read each position's role without importing tarot_data at module top."""
    SPREAD_ROLES.clear()
    for key, spread in spreads.items():
        SPREAD_ROLES[key] = spread.get('positions', [])
