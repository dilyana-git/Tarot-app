import os
import random
from flask import Flask, render_template, jsonify, request, abort, url_for
from data.tarot_data import (
    ALL_CARDS, MAJOR_ARCANA, SPREADS,
    get_card_by_id, get_cards_by_suit, get_major_arcana, get_minor_arcana,
)
from data.reading_composer import compose as compose_reading

app = Flask(__name__)
_secret = os.environ.get('SECRET_KEY')
if not _secret:
    import warnings
    warnings.warn(
        "SECRET_KEY env var not set — sessions are not secure. "
        "Set SECRET_KEY before deploying.",
        stacklevel=1,
    )
    _secret = 'dev-only-insecure-key'
app.secret_key = _secret

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


_IMG_EXTS = ('.jpg', '.jpeg', '.png', '.webp')


def get_card_image_path(filename):
    """Return filename if it exists on disk, trying alternate extensions, else placeholder."""
    base, ext = os.path.splitext(filename)
    candidates = [filename] + [base + alt for alt in _IMG_EXTS if alt != ext.lower()]
    for candidate in candidates:
        if os.path.exists(os.path.join(app.static_folder, candidate)):
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


def get_card_video_url(card):
    """Return a /static/… URL for the card's video, or empty string if none exists."""
    raw_vid = card.get('video', '')
    if raw_vid:
        path = f'media/{raw_vid}'
        if os.path.exists(os.path.join(app.static_folder, path)):
            return f'/static/{path}'

    slug = card['name'].lower().replace("'", '').replace(' ', '_')
    if slug.startswith('the_'):
        slug = slug[4:]
    path = f'media/{slug}.mp4'
    if os.path.exists(os.path.join(app.static_folder, path)):
        return f'/static/{path}'

    return ''

app.jinja_env.globals['get_card_video_url'] = get_card_video_url

@app.route('/')
def index():
    arcana = []
    for card in MAJOR_ARCANA:
        c = dict(card)
        img = get_card_image_filename(card)
        c['image_url'] = '' if img == 'images/card-placeholder.svg' else f'/static/{img}'
        c['video_url'] = get_card_video_url(card)
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

    return render_template('card_detail.html', card=card, prev_card=prev_card, next_card=next_card)


@app.route('/reading')
def reading():
    return render_template('reading.html', spreads=SPREADS)


@app.route('/api/reading', methods=['POST'])
def api_reading():
    data = request.get_json() or {}
    spread_key = data.get('spread', 'three_card')
    question = (data.get('question') or '').strip()

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


@app.route('/arcana-card')
def arcana_card():
    return render_template('arcana_card.html', cards=_arcana_widget_cards())


@app.route('/api/cards')
def api_cards():
    return jsonify([dict(c) for c in ALL_CARDS])


if __name__ == '__main__':
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug, port=5000)
