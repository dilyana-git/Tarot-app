import random
from flask import Flask, render_template, jsonify, request, abort
from data.tarot_data import (
    ALL_CARDS, MAJOR_ARCANA, SPREADS,
    get_card_by_id, get_cards_by_suit, get_major_arcana, get_minor_arcana,
)

app = Flask(__name__)


def draw_cards(n):
    drawn = random.sample(ALL_CARDS, n)
    for card in drawn:
        card = dict(card)
        card['reversed'] = random.random() < 0.35
    return [
        {**c, 'reversed': random.random() < 0.35}
        for c in drawn
    ]


@app.route('/')
def index():
    return render_template('index.html', major_arcana=MAJOR_ARCANA)


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
        title = 'All 78 Cards'

    return render_template(
        'cards.html',
        cards=display_cards,
        title=title,
        filter_type=filter_type,
        suit_filter=suit_filter,
        total=len(display_cards),
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
