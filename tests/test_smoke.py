"""Smoke tests for the Arcana tarot app.

Fast, dependency-light checks that the routes render, the JSON APIs return the
expected shape, and the narrative composer stays deterministic. Run with:

    pip install -r requirements-dev.txt
    pytest
"""
import os
import subprocess
import sys
from pathlib import Path

import pytest

from app import (
    app as flask_app, get_card_image_path, get_card_image_filename, MAX_CONTENT_LENGTH,
)

ROOT = Path(__file__).resolve().parent.parent
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
    '/lore',
    '/static/favicon.svg',
])
def test_pages_ok(client, path):
    assert client.get(path).status_code == 200


def test_lore_content_renders(client):
    resp = client.get('/lore')
    body = resp.data
    # Section spine and headline copy from lore_data are present.
    assert b'The Lore' in body
    assert b'A Short History' in body
    assert b'The Four Suits' in body
    # Each suit deep-links back into the deck.
    assert b'/cards?filter=minor&amp;suit=Wands' in body
    # The interactive pickers ship their full content server-side.
    assert body.count(b'data-rung-panel') == 14
    assert body.count(b'data-motif-panel') == 8


def test_lore_plates_fall_back_to_cartouches(client):
    """Lore art is optional and gitignored: with none on disk every slot must
    render the engraved empty state, never a broken <img>."""
    from app import lore_image_url
    assert lore_image_url('history-triumphs') in ('', '/static/images/lore/history-triumphs.webp',
                                                  '/static/images/lore/history-triumphs.jpg',
                                                  '/static/images/lore/history-triumphs.jpeg',
                                                  '/static/images/lore/history-triumphs.png')
    assert lore_image_url('definitely-not-a-plate') == ''
    assert lore_image_url('') == ''

    body = client.get('/lore').data
    if b'images/lore/' not in body:          # no art installed — the usual case
        assert b'lore-plate-empty' in body
        assert b'lore-plate-btn' not in body


def test_card_detail_out_of_range_404(client):
    resp = client.get('/card/9999')
    assert resp.status_code == 404
    assert b'Return Home' in resp.data  # on-brand 404 template, not Flask default


def test_unknown_page_404(client):
    assert client.get('/no-such-page').status_code == 404


# ── JSON APIs ──────────────────────────────────────────────────────────────────
def test_health(client):
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.get_json() == {'status': 'ok'}


def test_api_cards(client):
    data = client.get('/api/cards').get_json()
    assert len(data) == len(ALL_CARDS) == 78
    assert 'focal_point' not in data[0]
    assert 'video' not in data[0]


def test_security_headers(client):
    resp = client.get('/')
    assert resp.headers['X-Content-Type-Options'] == 'nosniff'
    assert resp.headers['X-Frame-Options'] == 'DENY'


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


def test_api_reading_oversized_body_413(client):
    body = b'{"spread":"three_card","question":"' + b'a' * (MAX_CONTENT_LENGTH + 1) + b'"}'
    resp = client.post('/api/reading', data=body, content_type='application/json')
    assert resp.status_code == 413
    assert resp.get_json() == {'error': 'Request too large'}


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


# ── Accessibility ─────────────────────────────────────────────────────────────
def test_card_detail_has_aria_tabs(client):
    resp = client.get('/card/0')
    assert b'role="tablist"' in resp.data
    assert b'role="tab"' in resp.data
    assert b'role="tabpanel"' in resp.data


def test_canvas_has_aria_hidden(client):
    resp = client.get('/')
    assert b'id="stars-canvas" aria-hidden="true"' in resp.data


# ── Image path resolution ──────────────────────────────────────────────────────
def test_image_path_falls_back_to_placeholder():
    # No such asset on disk → placeholder, never a broken path.
    assert get_card_image_path('images/major/does_not_exist.jpg') == 'images/card-placeholder.svg'


def test_placeholder_asset_exists():
    # The fallback above must resolve to a real file — it is committed despite
    # static/images/ being gitignored, via a negation in .gitignore.
    assert (ROOT / 'static' / 'images' / 'card-placeholder.svg').is_file()


def test_card_detail_omits_placeholder_img(client):
    """/card/<id> must never emit the placeholder as an <img>: that would 404 on a
    fresh clone, and once the file exists it trips the .has-image script, hiding
    the card's own typographic face behind one generic plate.

    Asserted against whichever branch this checkout is actually in, so the test
    holds both in CI (no art) and on a machine with real art on disk.
    """
    resp = client.get('/card/0')
    assert b'card-placeholder.svg' not in resp.data

    has_art = get_card_image_filename(ALL_CARDS[0]) != 'images/card-placeholder.svg'
    # the <img> element, not the class name in the script's querySelector
    emitted = b'<img class="card-detail-img"' in resp.data
    assert emitted is has_art


# ── Startup safety ─────────────────────────────────────────────────────────────
def _import_app(env):
    """Import app.py in a fresh interpreter, with SECRET_KEY/FLASK_DEBUG cleared
    first so only what `env` sets is present."""
    child = dict(os.environ)
    child.pop('SECRET_KEY', None)
    child.pop('FLASK_DEBUG', None)
    child.update(env)
    return subprocess.run(
        [sys.executable, '-c', 'import app'],
        cwd=ROOT, env=child, capture_output=True, text=True,
    )


def test_missing_secret_key_refuses_to_start():
    # gunicorn imports app:app — that path must fail loudly rather than serve
    # traffic signed with the key published in app.py.
    result = _import_app({})
    assert result.returncode != 0
    assert 'SECRET_KEY is not set' in result.stderr


def test_missing_secret_key_allowed_in_debug():
    result = _import_app({'FLASK_DEBUG': 'true'})
    assert result.returncode == 0, result.stderr


def test_secret_key_set_imports_cleanly():
    result = _import_app({'SECRET_KEY': 'a-real-key'})
    assert result.returncode == 0, result.stderr
