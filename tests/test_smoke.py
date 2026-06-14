"""Smoke tests for the Arcana tarot app.

Fast, dependency-light checks that the routes render, the JSON APIs return the
expected shape, and the narrative composer stays deterministic. Run with:

    pip install -r requirements-dev.txt
    pytest
"""
import pytest

from app import app as flask_app, get_card_image_path
from data.tarot_data import ALL_CARDS, SPREADS
from data.reading_composer import compose


@pytest.fixture()
def client():
    flask_app.config.update(TESTING=True)
    return flask_app.test_client()


# ── Pages render ───────────────────────────────────────────────────────────────
@pytest.mark.parametrize('path', [
    '/',
    '/cards',
    '/cards?filter=major',
    '/cards?filter=minor',
    '/cards?filter=minor&suit=Cups',
    '/card/0',
    '/card/77',
    '/reading',
    '/static/favicon.svg',
])
def test_pages_ok(client, path):
    assert client.get(path).status_code == 200


def test_card_detail_out_of_range_404(client):
    resp = client.get('/card/9999')
    assert resp.status_code == 404
    assert b'Return Home' in resp.data  # on-brand 404 template, not Flask default


def test_unknown_page_404(client):
    assert client.get('/no-such-page').status_code == 404


# ── JSON APIs ──────────────────────────────────────────────────────────────────
def test_api_cards(client):
    data = client.get('/api/cards').get_json()
    assert len(data) == len(ALL_CARDS) == 78


def test_api_unknown_path_returns_json_404(client):
    resp = client.get('/api/nope')
    assert resp.status_code == 404
    assert resp.get_json() == {'error': 'Not found'}


@pytest.mark.parametrize('spread_key', list(SPREADS))
def test_api_reading_shape(client, spread_key):
    resp = client.post('/api/reading', json={'spread': spread_key, 'question': 'What should I focus on?'})
    assert resp.status_code == 200
    data = resp.get_json()
    expected = len(SPREADS[spread_key]['positions'])
    assert len(data['cards']) == expected
    assert all(c.get('narrative') for c in data['cards'])
    assert 'reading_notes' in data
    # every card carries its position metadata
    assert all(c.get('position') for c in data['cards'])


def test_api_reading_unknown_spread_400(client):
    resp = client.post('/api/reading', json={'spread': 'not_a_spread'})
    assert resp.status_code == 400


# ── Composer ───────────────────────────────────────────────────────────────────
def _fake_draw(spread_key):
    spread = SPREADS[spread_key]
    n = len(spread['positions'])
    cards = []
    for i, c in enumerate(ALL_CARDS[:n]):
        cards.append({
            'id': c['id'], 'name': c['name'], 'number': c['number'],
            'arcana': c['arcana'], 'suit': c.get('suit'), 'element': c['element'],
            'keywords_upright': c['keywords_upright'], 'keywords_reversed': c['keywords_reversed'],
            'reversed': i % 2 == 0,
            'position': spread['positions'][i]['name'],
            'position_meaning': spread['positions'][i]['meaning'],
        })
    return cards


@pytest.mark.parametrize('spread_key', list(SPREADS))
def test_composer_deterministic_and_complete(spread_key):
    cards = _fake_draw(spread_key)
    a = compose(cards, spread_key, 'Will this work out at my job?')
    b = compose(cards, spread_key, 'Will this work out at my job?')
    assert a == b  # deterministic for a given draw
    assert len(a['narratives']) == len(cards)
    assert all(n for n in a['narratives'])
    blob = ' '.join(a['narratives']) + a['reading_notes']
    assert '{' not in blob and '}' not in blob  # no unsubstituted placeholders


# ── Image path resolution ──────────────────────────────────────────────────────
def test_image_path_falls_back_to_placeholder():
    # No such asset on disk → placeholder, never a broken path.
    assert get_card_image_path('images/major/does_not_exist.jpg') == 'images/card-placeholder.svg'
