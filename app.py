import mimetypes
import os
import random
from functools import lru_cache
from flask import Flask, render_template, jsonify, request, abort, url_for
from data.tarot_data import (
    ALL_CARDS, MAJOR_ARCANA, SPREADS,
    get_card_by_id, get_cards_by_suit, get_major_arcana, get_minor_arcana,
)
from data.reading_composer import compose as compose_reading
from data.lore_data import (
    LORE_INTRO, LORE_HERO_IMAGE, CHAPTERS, HISTORY_TIMELINE, DECK_STRUCTURE,
    SUITS, NUMEROLOGY, SYMBOLS, READING_ETHOS,
)

app = Flask(__name__)
# Windows' mimetypes registry has no .webp entry, so the card art would be
# served as application/octet-stream. Register it before the first send_file.
mimetypes.add_type('image/webp', '.webp')

# A missing SECRET_KEY must not boot quietly in production. The old behaviour was
# a warnings.warn, which is invisible in most log pipelines — the app would come up
# looking healthy (/health returns ok) while signing sessions with a key that is
# published in this file.
#
# Running as a script (`python app.py`) is the local dev path and keeps the
# warn-and-continue behaviour, so the documented quickstart still works with no
# setup. Anything that *imports* the module is a real server — gunicorn imports
# `app:app` — and is refused at import time, so the deploy fails loudly instead
# of serving insecurely. FLASK_DEBUG=true opts out either way.
_secret = os.environ.get('SECRET_KEY')
_debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
if not _secret:
    if __name__ != '__main__' and not _debug:
        raise RuntimeError(
            'SECRET_KEY is not set. Refusing to start: sessions would be signed '
            'with a publicly-known key. Set SECRET_KEY to a random secret, or set '
            'FLASK_DEBUG=true for local development.'
        )
    import warnings
    warnings.warn(
        "SECRET_KEY env var not set — sessions are not secure. "
        "Set SECRET_KEY before deploying.",
        stacklevel=1,
    )
    _secret = 'dev-only-insecure-key'
app.secret_key = _secret

_ALLOWED_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
_ALLOWED_ORIGINS = [o.strip() for o in _ALLOWED_ORIGINS if o.strip()]

# Cap on request bodies. /api/reading is an unauthenticated public POST, and
# without a ceiling Werkzeug buffers whatever a client sends. The only body the
# app reads is that endpoint's small JSON object — whose `question` is truncated
# to 500 chars anyway — so 64 KB is far above anything legitimate.
MAX_CONTENT_LENGTH = 64 * 1024
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


@app.after_request
def _security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    if _ALLOWED_ORIGINS and request.path.startswith('/api/'):
        origin = request.headers.get('Origin', '')
        if origin in _ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# Mapping for minor card numbers to filename ranks
MINOR_RANK_MAP = {
    'Ace': 'ace',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten',
    'Page': 'page',
    'Knight': 'knight',
    'Queen': 'queen',
    'King': 'king'
}


# WebP first: the art on disk is .webp (card data still names .jpg), and it is
# ~7x smaller than the PNG/JPEG originals at the same on-screen size.
_IMG_EXTS = ('.webp', '.jpg', '.jpeg', '.png')


@lru_cache(maxsize=None)
def _static_exists(relpath):
    """Cached os.path.exists for a path under static/. Card data is static, so
    image resolution probes the same handful of paths on every request; without
    this, /cards alone fires ~300 disk stats per load. Cache is cleared only by
    restart, which matches how the assets are deployed."""
    return os.path.exists(os.path.join(app.static_folder, relpath))


def get_card_image_path(filename):
    """Return the best existing file for this card, else the placeholder.

    _IMG_EXTS order wins over the extension named in the card data, so dropping
    a .jpg back into the tree can't beat the .webp we actually ship."""
    base, ext = os.path.splitext(filename)
    candidates = [base + alt for alt in _IMG_EXTS]
    if ext.lower() not in _IMG_EXTS:
        candidates.append(filename)
    for candidate in candidates:
        if _static_exists(candidate):
            return candidate
    return 'images/card-placeholder.svg'


def get_card_image_filename(card):
    if card.get('image'):
        path = card['image']
        if not path.startswith('images/'):
            path = f'images/{path}'
        return get_card_image_path(path)

    if card['arcana'] == 'minor' and card.get('suit'):
        rank = MINOR_RANK_MAP.get(card['number'], str(card['number']).lower().replace(' ', '_'))
        return get_card_image_path(f"images/minor/{card['suit'].lower()}/{rank}")

    slug = card['name'].lower().replace("'", '').replace(' ', '_')
    if slug.startswith('the_'):
        slug = slug[4:]
    return get_card_image_path(f"images/major/{slug}")

app.jinja_env.globals['get_card_image_filename'] = get_card_image_filename


def lore_image_url(slug):
    """Return a /static/… URL for a lore plate, or '' when that art has not been
    generated yet. Empty is a supported state: lore.html renders an engraved
    cartouche in the slot instead of a broken image, so the page is complete
    with no lore art on disk at all. Probes the same extensions, in the same
    order, as the card art."""
    if not slug:
        return ''
    for ext in _IMG_EXTS:
        rel = f'images/lore/{slug}{ext}'
        if _static_exists(rel):
            return f'/static/{rel}'
    return ''

app.jinja_env.globals['lore_image_url'] = lore_image_url


@app.route('/')
def index():
    arcana = []
    for card in MAJOR_ARCANA:
        c = dict(card)
        img = get_card_image_filename(card)
        c['image_url'] = '' if img == 'images/card-placeholder.svg' else f'/static/{img}'
        arcana.append(c)

    return render_template('index.html', major_arcana=arcana, cards=_arcana_widget_cards())


def _card_json(card):
    img = get_card_image_filename(card)
    return {
        'id':       card['id'],
        'name':     card['name'],
        'number':   card['number'],
        'arcana':   card['arcana'],
        'suit':     card.get('suit'),
        'element':  card.get('element', ''),
        'astro':    card.get('astro', ''),   # majors only; '' for the minors
        'symbol':   card.get('symbol', '✦'),
        'keywords_upright': card.get('keywords_upright', [])[:3],
        'description': card.get('description', ''),
        'image_url': '' if img == 'images/card-placeholder.svg' else f'/static/{img}',
        'card_color':   card.get('card_color', '#162420'),
        'accent_color': card.get('accent_color', '#c4933a'),
    }

@app.route('/cards')
def cards():
    filter_type = request.args.get('filter', 'all')
    suit_filter = request.args.get('suit', None)

    if filter_type == 'major':
        display_cards = get_major_arcana()
        title = 'Major Arcana'
    elif filter_type == 'minor':
        if suit_filter:
            display_cards = get_cards_by_suit(suit_filter)
            title = f'Suit of {suit_filter}'
        else:
            display_cards = get_minor_arcana()
            title = 'Minor Arcana'
    else:
        display_cards = ALL_CARDS
        title = 'The Deck'

    # Spread-view data (always the full deck, grouped)
    spread = {
        'major':     [_card_json(c) for c in get_major_arcana()],
        'wands':     [_card_json(c) for c in get_cards_by_suit('Wands')],
        'cups':      [_card_json(c) for c in get_cards_by_suit('Cups')],
        'swords':    [_card_json(c) for c in get_cards_by_suit('Swords')],
        'pentacles': [_card_json(c) for c in get_cards_by_suit('Pentacles')],
    }

    return render_template(
        'cards.html',
        cards=display_cards,
        title=title,
        filter_type=filter_type,
        suit_filter=suit_filter,
        total=len(display_cards),
        spread=spread,
    )


@app.route('/card/<int:card_id>')
def card_detail(card_id):
    card = get_card_by_id(card_id)
    if card is None:
        abort(404)

    prev_card = get_card_by_id(card_id - 1) if card_id > 0 else None
    next_card = get_card_by_id(card_id + 1) if card_id < len(ALL_CARDS) - 1 else None

    # Where the "back" link points. A reading is an ephemeral random draw with no
    # URL of its own (it's restored from sessionStorage on /reading), so when the
    # user arrives via the reading's "View Full Card" link (?from=reading) we send
    # them back there; otherwise back to the deck listing. The marker is carried
    # through prev/next so the escape hatch survives browsing adjacent cards.
    came_from_reading = request.args.get('from') == 'reading'
    if came_from_reading:
        back_href, back_label = url_for('reading'), 'Back to your reading'
    else:
        back_href, back_label = url_for('cards'), 'Back to the deck'

    nav_args = {'from': 'reading'} if came_from_reading else {}
    prev_href = url_for('card_detail', card_id=prev_card['id'], **nav_args) if prev_card else None
    next_href = url_for('card_detail', card_id=next_card['id'], **nav_args) if next_card else None

    return render_template(
        'card_detail.html', card=card,
        prev_card=prev_card, next_card=next_card,
        prev_href=prev_href, next_href=next_href,
        back_href=back_href, back_label=back_label,
    )


@app.route('/lore')
def lore():
    return render_template(
        'lore.html',
        intro=LORE_INTRO,
        hero_image=LORE_HERO_IMAGE,
        chapters=CHAPTERS,
        timeline=HISTORY_TIMELINE,
        deck=DECK_STRUCTURE,
        suits=SUITS,
        numerology=NUMEROLOGY,
        symbols=SYMBOLS,
        ethos=READING_ETHOS,
    )


@app.route('/reading')
def reading():
    return render_template('reading.html', spreads=SPREADS)


@app.route('/api/reading', methods=['POST'])
def api_reading():
    data = request.get_json(silent=True) or {}
    spread_key = data.get('spread', 'three_card')
    question = (data.get('question') or '').strip()[:500]

    if spread_key not in SPREADS:
        return jsonify({'error': 'Unknown spread'}), 400

    spread = SPREADS[spread_key]
    num_cards = len(spread['positions'])
    drawn = random.sample(ALL_CARDS, num_cards)

    result_cards = []
    for i, card in enumerate(drawn):
        img_filename = get_card_image_filename(card)
        image_url = '' if img_filename == 'images/card-placeholder.svg' else f'/static/{img_filename}'
        pos = spread['positions'][i]
        result_cards.append({
            'id': card['id'],
            'name': card['name'],
            'number': card['number'],
            'arcana': card['arcana'],
            'suit': card.get('suit'),
            'symbol': card['symbol'],
            'element': card['element'],
            'keywords_upright': card['keywords_upright'],
            'keywords_reversed': card['keywords_reversed'],
            'upright_meaning': card['upright_meaning'],
            'reversed_meaning': card['reversed_meaning'],
            'description': card['description'],
            'card_color': card['card_color'],
            'accent_color': card['accent_color'],
            'reversed': random.random() < 0.35,
            'position': pos['name'],
            'position_meaning': pos['meaning'],
            'image_url': image_url,
        })

    # Compose a per-card narrative (position × neighbours × question) plus a
    # one-line note on whole-reading patterns. Purely additive — the cards still
    # carry their static meanings; the narrative is an extra, reading-specific layer.
    composed = compose_reading(result_cards, spread_key, question)
    for card, narrative in zip(result_cards, composed['narratives']):
        card['narrative'] = narrative

    return jsonify({
        'spread': spread,
        'cards': result_cards,
        'reading_notes': composed['reading_notes'],
    })


_ROMAN_NUMERALS = [
    '0','I','II','III','IV','V','VI','VII','VIII','IX','X',
    'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI',
]

def _arcana_widget_cards():
    """Build the card list expected by the arcana-card widget from MAJOR_ARCANA."""
    result = []
    for i, card in enumerate(MAJOR_ARCANA):
        img_filename = get_card_image_filename(card)
        image_url = '' if img_filename == 'images/card-placeholder.svg' else f'/static/{img_filename}'
        num_int = i  # 0-based index matches roman numeral position
        result.append({
            'id':       card['name'].lower().replace("'", '').replace(' ', '_').removeprefix('the_'),
            'roman':    _ROMAN_NUMERALS[num_int],
            'num':      str(num_int).zfill(2),
            'name':     card['name'].upper(),
            'element':  card.get('element', 'AIR').upper(),
            'keywords': [k.upper() for k in card.get('keywords_upright', [])[:3]],
            'meaning':  card.get('upright_meaning', ''),
            'image':    image_url,
        })
    return result


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/cards')
def api_cards():
    return jsonify([_card_json(c) for c in ALL_CARDS])


@app.errorhandler(404)
def not_found(error):
    # API paths get JSON; pages get the on-brand template.
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found'}), 404
    return render_template('404.html'), 404


@app.errorhandler(413)
def payload_too_large(error):
    # Only /api/reading reads a body, so in practice this is always the JSON
    # branch; the page branch keeps the response on-brand if that ever changes.
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Request too large'}), 413
    return render_template('404.html'), 413


@app.errorhandler(500)
def server_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Internal server error'}), 500
    return render_template('500.html'), 500


if __name__ == '__main__':
    app.run(debug=_debug, port=5000)
