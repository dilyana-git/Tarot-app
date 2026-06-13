/* ============================================================
   ARCANA TAROT — Reading page
   Flow:  select spread → set intention → shuffle → deal face-down
          → tap each card to reveal → tap a revealed card for details
   Loaded in {% block scripts %} (before main.js); SPREADS is injected
   onto window just above this script tag.
   ============================================================ */
(function initReading() {
  const root = document.querySelector('.reading-layout');
  if (!root) return;   // not on the reading page

  const SPREADS = window.SPREADS || {};
  const reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── element references ──────────────────────────────────── */
  const $ = id => document.getElementById(id);
  const els = {
    leftTitle:     $('readingLeftTitle'),
    leftSelector:  $('leftSelector'),
    leftIntention: $('leftIntention'),
    leftResult:    $('leftResult'),

    intentDesc:      $('intentSpreadDesc'),
    intentPositions: $('intentPositions'),
    asked:           $('readingAsked'),
    resultDesc:      $('resultSpreadDesc'),
    notes:           $('readingNotes'),
    legend:          $('readingLegend'),

    stageSelect:    $('stageSelect'),
    stageIntention: $('stageIntention'),
    loading:        $('readingLoading'),
    error:          $('readingError'),
    stageBoard:     $('stageBoard'),

    intentionName:  $('intentionSpreadName'),
    intentionInput: $('intentionInput'),
    intentionDraw:  $('intentionDraw'),
    intentionBack:  $('intentionBack'),
    errorRetry:     $('errorRetry'),

    boardHint:  $('boardHint'),
    revealAll:  $('revealAllBtn'),
    layout:     $('spreadLayout'),

    panel:       $('cardPanel'),
    panelClose:  $('panelClose'),
    panelVisual: $('panelCardVisual'),
    panelInfo:   $('panelCardInfo'),
  };

  /* ── state ───────────────────────────────────────────────── */
  let currentSpread = 'three_card';
  let question = '';
  let drawnCards = [];
  let panelLastFocus = null;

  /* ── helpers ─────────────────────────────────────────────── */
  const show = el => { if (el) el.hidden = false; };
  const hide = el => { if (el) el.hidden = true; };

  /* HTML-escape — used for every value interpolated into innerHTML so a
     malicious image URL or (especially) the user's typed question can't
     inject markup. The question is also rendered with textContent below. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* First sentence only — keeps each legend meaning to one compact line. */
  function firstSentence(text) {
    const s = String(text || '').trim();
    const m = s.match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : s;
  }

  /* ── stage machine — exactly one right-column stage + one left
        panel visible at a time ─────────────────────────────── */
  function setStage(stage) {
    [els.stageSelect, els.stageIntention, els.loading, els.error, els.stageBoard].forEach(hide);
    [els.leftSelector, els.leftIntention, els.leftResult].forEach(hide);

    switch (stage) {
      case 'select':    show(els.stageSelect);    show(els.leftSelector);  break;
      case 'intention': show(els.stageIntention); show(els.leftIntention); break;
      case 'loading':   show(els.loading);        show(els.leftIntention); break;
      case 'error':     show(els.error);          show(els.leftIntention); break;
      case 'board':     show(els.stageBoard);     show(els.leftResult);    break;
    }
  }

  /* ── 1 · choose a spread → intention ─────────────────────── */
  function chooseSpread(key) {
    const spread = SPREADS[key];
    if (!spread) return;
    currentSpread = key;

    document.querySelectorAll('.spread-option').forEach(o =>
      o.classList.toggle('selected', o.dataset.spread === key));

    els.leftTitle.textContent  = spread.name;
    els.intentionName.textContent = spread.name;
    els.intentDesc.textContent = spread.description;
    els.intentPositions.innerHTML = spread.positions.map((p, i) =>
      `<li class="pos-preview-item">
         <span class="pos-preview-num">${i + 1}</span>
         <span class="pos-preview-name">${esc(p.name)}</span>
       </li>`).join('');

    setStage('intention');
    if (els.intentionInput) {
      els.intentionInput.value = '';
      setTimeout(() => els.intentionInput.focus(), 60);
    }
  }

  /* ── 2 · shuffle + draw ──────────────────────────────────── */
  async function shuffleAndDraw() {
    question = (els.intentionInput && els.intentionInput.value || '').trim();
    setStage('loading');

    // Let the shuffle animation breathe before the cards appear.
    const minDelay = reduceMotion ? 150 : 1200;
    const started = Date.now();
    const after = (fn) => setTimeout(fn, Math.max(0, minDelay - (Date.now() - started)));

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The question feeds the server-side narrative composer (it tailors a
        // "lens" sentence to the asked topic); it is never persisted.
        body: JSON.stringify({ spread: currentSpread, question }),
      });
      if (!res.ok) throw new Error('Server error ' + res.status);
      const data = await res.json();
      after(() => renderReading(data));
    } catch (e) {
      console.error('Reading draw failed:', e);
      after(() => setStage('error'));
    }
  }

  /* ── 3 · render the board (all cards start face-down) ─────── */
  function renderReading(data) {
    drawnCards = data.cards;

    els.leftTitle.textContent = data.spread.name;
    els.resultDesc.textContent = data.spread.description;

    // Echo the asked question — textContent keeps it XSS-safe.
    if (question) {
      els.asked.textContent = '“' + question + '”';
      show(els.asked);
    } else {
      els.asked.textContent = '';
      hide(els.asked);
    }

    // Whole-reading observation (mostly Major Arcana, a dominant suit, many
    // reversals) — shown once here rather than repeated on every card.
    if (els.notes) {
      const notes = (data.reading_notes || '').trim();
      if (notes) { els.notes.textContent = notes; show(els.notes); }
      else { els.notes.textContent = ''; hide(els.notes); }
    }

    els.layout.className = 'spread-layout spread-' + currentSpread.replace(/_/g, '-');
    els.layout.innerHTML = data.cards.map(cardMarkup).join('');

    els.layout.querySelectorAll('.spread-card').forEach(sc => {
      const i = +sc.dataset.index;
      sc.addEventListener('click', () => onCardActivate(i));
      sc.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardActivate(i); }
      });
    });

    buildLegend(data.cards);
    updateBoardHint();
    setStage('board');
    autoReveal();   // cards turn themselves over, one after another
  }

  function cardMarkup(card, i) {
    const rev = card.reversed ? ' reversed' : '';
    const img = card.image_url
      ? `<img class="spread-card-img" src="${esc(card.image_url)}" alt="${esc(card.name)}">` : '';
    return `
      <div class="spread-card-wrap" style="--delay:${(i * 0.08).toFixed(2)}s">
        <div class="spread-card${rev}"
             style="--card-color:${esc(card.card_color)};--accent-color:${esc(card.accent_color)}"
             data-index="${i}" role="button" tabindex="0"
             aria-label="${esc(card.position)} — face down, activate to reveal">
          <span class="spread-card-num">${i + 1}</span>
          <div class="spread-card-flip">
            <div class="spread-card-back"><span class="card-back-symbol">✦</span></div>
            <div class="spread-card-face">
              ${img}
              <div class="sc-number">${esc(card.number)}</div>
              ${card.reversed ? '<div class="sc-reversed-badge">Reversed</div>' : ''}
            </div>
          </div>
        </div>
        <span class="spread-card-label">${esc(card.position)}</span>
      </div>`;
  }

  /* ── 4 · card interaction: 1st activate flips, 2nd opens panel ── */
  function onCardActivate(i) {
    const sc = els.layout.querySelector('.spread-card[data-index="' + i + '"]');
    if (!sc) return;
    if (sc.classList.contains('revealed')) openCardPanel(i);
    else revealCard(i, sc);
  }

  function revealCard(i, sc) {
    if (sc.classList.contains('revealed')) return;
    sc.classList.add('revealed');

    const card = drawnCards[i];
    sc.setAttribute('aria-label',
      `${card.position} — ${card.name}${card.reversed ? ', reversed' : ''}. Activate for full details.`);

    // Fill the matching legend entry now that the card is known.
    const li = els.legend.querySelector('.legend-item[data-index="' + i + '"]');
    if (li) {
      li.classList.add('is-revealed');
      const nameEl = li.querySelector('[data-role="name"]');
      const meanEl = li.querySelector('[data-role="meaning"]');
      if (nameEl) nameEl.textContent = card.name + (card.reversed ? ' · Reversed' : '');
      if (meanEl) meanEl.textContent =
        firstSentence(card.reversed ? card.reversed_meaning : card.upright_meaning);
    }
  }

  /* Cards turn themselves over in a staggered sequence after the deal.
     Manual taps still work (revealCard is idempotent), so tapping a card
     before its scheduled flip simply reveals it a beat early. */
  function autoReveal() {
    const cards = els.layout.querySelectorAll('.spread-card');
    const startDelay = reduceMotion ? 0 : 450;   // let the deal settle first
    const stagger    = reduceMotion ? 0 : 190;   // gap between each flip
    cards.forEach((sc, n) => {
      const i = +sc.dataset.index;
      setTimeout(() => revealCard(i, sc), startDelay + n * stagger);
    });
    // Once every card has turned, swap the hint to the "details" prompt.
    const settled = startDelay + cards.length * stagger + (reduceMotion ? 0 : 300);
    setTimeout(() => {
      els.boardHint.textContent = cards.length === 1
        ? 'Tap the card for its full meaning'
        : 'Tap any card for its full meaning';
    }, settled);
  }

  function updateBoardHint() {
    // Shown while the cards are turning; autoReveal swaps it once they settle.
    els.boardHint.textContent = 'The cards are turning…';
    if (els.revealAll) els.revealAll.hidden = true;   // auto-reveal makes it moot
  }

  /* ── 5 · legend (position purpose shown up front; card meaning
        fills in on reveal so nothing is spoiled) ───────────── */
  function buildLegend(cards) {
    els.legend.innerHTML = cards.map((card, i) => `
      <div class="legend-item" data-index="${i}">
        <span class="legend-num">${i + 1}</span>
        <div class="legend-text">
          <span class="legend-pos">${esc(card.position)}</span>
          <span class="legend-name" data-role="name">Face down — tap to reveal</span>
          <p class="legend-meaning" data-role="meaning">${esc(card.position_meaning || '')}</p>
        </div>
      </div>`).join('');

    els.legend.querySelectorAll('.legend-item').forEach(item => {
      const i = item.dataset.index;
      const card = els.layout.querySelector('.spread-card[data-index="' + i + '"]');
      const on  = () => { item.classList.add('is-linked'); if (card) card.classList.add('is-linked'); };
      const off = () => { item.classList.remove('is-linked'); if (card) card.classList.remove('is-linked'); };
      item.addEventListener('mouseenter', on);
      item.addEventListener('mouseleave', off);
      if (card) {
        card.addEventListener('mouseenter', on);
        card.addEventListener('mouseleave', off);
      }
      // A revealed legend entry opens the detail panel, like its card.
      item.addEventListener('click', () => {
        const sc = els.layout.querySelector('.spread-card[data-index="' + i + '"]');
        if (sc && sc.classList.contains('revealed')) openCardPanel(+i);
      });
    });
  }

  /* ── 6 · detail panel ────────────────────────────────────── */
  function openCardPanel(index) {
    const card = drawnCards[index];
    if (!card) return;

    const suitSymbol  = { Wands: '△', Cups: '▽', Swords: '✕', Pentacles: '⊕' };
    const suitDisplay = card.suit ? (suitSymbol[card.suit] + ' ' + card.suit) : 'Major Arcana';
    const meaning     = card.reversed ? card.reversed_meaning : card.upright_meaning;
    const keywords    = card.reversed ? card.keywords_reversed : card.keywords_upright;

    els.panelVisual.innerHTML = `
      <div class="panel-card ${card.reversed ? 'reversed' : ''}"
           style="--card-color:${esc(card.card_color)};--accent-color:${esc(card.accent_color)}">
        ${card.image_url ? `<img class="panel-card-img" src="${esc(card.image_url)}" alt="${esc(card.name)}">` : ''}
        <div class="panel-card-inner">
          <div class="panel-card-number">${esc(card.number)}</div>
          <div class="panel-card-suit">${esc(suitDisplay)}</div>
        </div>
      </div>
      ${card.reversed ? '<p class="panel-reversed-label">↩ Reversed</p>' : ''}`;

    els.panelInfo.innerHTML = `
      <p class="panel-position-top">${esc(card.position)}</p>
      ${card.position_meaning ? `<p class="panel-position-meaning">${esc(card.position_meaning)}</p>` : ''}
      <h3 class="panel-card-title">${esc(card.name)}</h3>
      <p class="panel-element">✦ ${esc(card.element)} · ${card.arcana === 'major' ? 'Major Arcana' : esc(card.suit)}</p>
      <div class="panel-keywords">
        ${(keywords || []).map(k => `<span class="keyword-tag ${card.reversed ? 'keyword-reversed' : 'keyword-upright'}">${esc(k)}</span>`).join('')}
      </div>
      ${card.narrative ? `
      <div class="panel-narrative">
        <h4>✦ In This Reading</h4>
        <p>${esc(card.narrative)}</p>
      </div>` : ''}
      <div class="panel-meaning">
        <h4>${card.reversed ? '↩ Reversed' : '☝ Upright'} Meaning</h4>
        <p>${esc(meaning)}</p>
      </div>
      <a href="/card/${encodeURIComponent(card.id)}" class="btn btn-outline btn-sm" target="_self">View Full Card →</a>`;

    panelLastFocus = document.activeElement;
    els.panel.style.display = 'flex';
    els.panelClose.focus();
  }

  function closePanel() {
    if (els.panel.style.display === 'none' || !els.panel.style.display) return;
    els.panel.style.display = 'none';
    if (panelLastFocus && document.contains(panelLastFocus)) panelLastFocus.focus();
    panelLastFocus = null;
  }

  /* ── 7 · new reading (back to the start) ─────────────────── */
  function newReading() {
    drawnCards = []; question = '';
    els.layout.innerHTML = '';
    els.legend.innerHTML = '';
    if (els.notes) { els.notes.textContent = ''; hide(els.notes); }
    els.panel.style.display = 'none';
    els.leftTitle.textContent = 'Your Reading';
    setStage('select');
  }

  /* ── wiring ──────────────────────────────────────────────── */
  document.querySelectorAll('.spread-option').forEach(opt =>
    opt.addEventListener('click', () => chooseSpread(opt.dataset.spread)));

  els.intentionDraw.addEventListener('click', shuffleAndDraw);
  els.intentionBack.addEventListener('click', () => setStage('select'));
  els.intentionInput.addEventListener('keydown', e => {
    // Enter draws; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); shuffleAndDraw(); }
  });
  if (els.errorRetry) els.errorRetry.addEventListener('click', shuffleAndDraw);

  const newBtn = $('newReadingBtn');
  if (newBtn) newBtn.addEventListener('click', newReading);

  els.panelClose.addEventListener('click', closePanel);
  els.panel.addEventListener('click', e => { if (e.target === els.panel) closePanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  setStage('select');
})();
