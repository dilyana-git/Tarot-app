import os
import random
from flask import Flask, render_template, jsonify, request, abort
from data.tarot_data import (
    ALL_CARDS, MAJOR_ARCANA, SPREADS,
    get_card_by_id, get_cards_by_suit, get_major_arcana, get_minor_arcana,
)

app = Flask(__name__)

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


def draw_cards(n):
    drawn = random.sample(ALL_CARDS, n)
    for card in drawn:
        card = dict(card)
        card['reversed'] = random.random() < 0.35
    return [
        {**c, 'reversed': random.random() < 0.35}
        for c in drawn
    ]


_HERO_TEMPLATES = {
    'architectural': 'index.html',
    'cardfirst':     'index_cardfirst.html',
    'editorial':     'index_editorial.html',
}

@app.route('/')
def index():
    arcana = []
    for card in MAJOR_ARCANA:
        c = dict(card)
        raw_img = card.get('image', '')
        if raw_img:
            img_path = raw_img if raw_img.startswith('images/') else f'images/{raw_img}'
        else:
            slug = card['name'].lower().replace("'", '').replace(' ', '_')
            if slug.startswith('the_'):
                slug = slug[4:]
            img_path = f'images/major/{slug}.jpg'
        resolved = get_card_image_path(img_path)
        c['image_url'] = '' if resolved == 'images/card-placeholder.svg' else f'/static/{resolved}'
        c['video_url'] = ''
        arcana.append(c)

    hero = request.args.get('hero', 'architectural')
    template = _HERO_TEMPLATES.get(hero, 'index.html')
    return render_template(template, major_arcana=arcana)


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
        'keywords': card.get('keywords_upright', [])[:3],
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
    data = request.get_json()
    spread_key = data.get('spread', 'three_card')

    if spread_key not in SPREADS:
        return jsonify({'error': 'Unknown spread'}), 400

    spread = SPREADS[spread_key]
    num_cards = len(spread['positions'])
    drawn = random.sample(ALL_CARDS, num_cards)

    result_cards = []
    for i, card in enumerate(drawn):
        img_filename = get_card_image_filename(card)
        image_url = '' if img_filename == 'images/card-placeholder.svg' else f'/static/{img_filename}'
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
            'position': spread['positions'][i],
            'image_url': image_url,
        })

    return jsonify({
        'spread': spread,
        'cards': result_cards,
    })


@app.route('/api/cards')
def api_cards():
    return jsonify([
        {k: v for k, v in c.items()}
        for c in ALL_CARDS
    ])


if __name__ == '__main__':
    app.run(debug=True, port=5000)
