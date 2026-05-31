/* ============================================================
   Arcana — Home hero controller (mosaic edition)

   Mounts the framework-free mosaic-tiling card (arcana-card.js) inside the
   home page's round .main-card frame, and drives the surrounding hero UI —
   the left text column, the progress counter, the nav buttons — from the
   widget's onCard callback. Also re-creates the orbiting gold orbs on the
   SVG rings. Replaces the old oval-crossfade arcana-hero.js.

   Reads window.ARCANA (injected by Flask in templates/index.html).
   ============================================================ */
(function () {
  'use strict';

  if (!window.ArcanaCards || typeof window.ArcanaCards.mount !== 'function') return;

  var raw = (window.ARCANA || []).filter(function (c) { return c.arcana === 'major'; });
  if (!raw.length) return;

  var ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X',
               'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

  // Map the Flask card dicts → the shape arcana-card.js expects.
  var cards = raw.map(function (c, i) {
    return {
      id:       String(c.name || '').toLowerCase().replace(/'/g, '').replace(/^the /, '').replace(/\s+/g, '_'),
      roman:    ROMAN[i] || String(i),
      num:      String(i).padStart(2, '0'),
      name:     String(c.name || '').toUpperCase(),
      element:  String(c.element || 'AIR').toUpperCase(),
      keywords: (c.keywords_upright || []).slice(0, 3).map(function (k) { return String(k).toUpperCase(); }),
      meaning:  c.upright_meaning || c.description || '',
      image:    c.image_url || ''
    };
  });

  // ── DOM refs (the hero text column + counter) ─────────────
  var $ = function (id) { return document.getElementById(id); };
  var els = {
    mount:          $('heroMosaicMount'),
    cardNum:        $('cardNum'),
    cardTitle:      $('cardTitle'),
    kwRow:          $('kwRow'),
    cardDesc:       $('cardDesc'),
    cardElement:    $('cardElement'),
    cardSymbol:     $('cardSymbol'),
    navPrev:        $('navPrev'),
    navNext:        $('navNext'),
    prevRoman:      $('prevRoman'),
    nextRoman:      $('nextRoman'),
    counterIdx:     $('counterIdx'),
    counterFill:    $('counterFill'),
    counterTrack:   $('counterTrack'),
    counterPrev:    $('counterPrev'),
    counterNext:    $('counterNext'),
    counterCaption: $('counterCaption')
  };
  if (!els.mount) return;

  var raws = raw; // keep the rich dicts for description/symbol
  var stripThe = function (n) { return String(n || '').replace(/^THE /i, ''); };

  // ── Progress ticks ────────────────────────────────────────
  if (els.counterTrack) {
    cards.forEach(function (_, i) {
      var tick = document.createElement('button');
      tick.className = 'counter-tick';
      tick.style.left = (cards.length > 1 ? (i / (cards.length - 1)) * 100 : 0) + '%';
      tick.setAttribute('aria-label', cards[i].name);
      tick.setAttribute('title', cards[i].name);
      tick.addEventListener('click', function () { widget && widget.go(i); });
      els.counterTrack.appendChild(tick);
    });
  }

  // ── Update the hero text column + counter for card `i` ─────
  function syncHero(card, i, neighbours) {
    var rc = raws[i] || {};
    if (els.cardNum)     els.cardNum.textContent = String(i).padStart(2, '0');
    if (els.cardTitle)   els.cardTitle.textContent = card.name;
    if (els.cardDesc)    els.cardDesc.textContent = rc.description || card.meaning || '';
    if (els.cardElement) els.cardElement.textContent = card.element;
    if (els.cardSymbol)  els.cardSymbol.textContent = rc.symbol || '✦';

    if (els.kwRow) {
      els.kwRow.innerHTML = '';
      card.keywords.forEach(function (k, j) {
        var span = document.createElement('span');
        // The diamond separator is drawn via a ::before on every keyword after the
        // first, so it's part of that keyword's own box — it can never wrap away
        // and strand at the end of a line (and there's never a trailing one).
        span.className = j > 0 ? 'kw kw-sep' : 'kw';
        span.textContent = k;
        els.kwRow.appendChild(span);
      });
    }

    var pct = cards.length > 1 ? (i / (cards.length - 1)) * 100 : 0;
    if (els.counterIdx)  els.counterIdx.textContent = String(i).padStart(2, '0');
    if (els.counterFill) els.counterFill.style.width = pct + '%';
    if (els.counterCaption) els.counterCaption.textContent = card.name + ' · CARD ' + card.num + ' OF XXI';

    if (els.counterTrack) {
      var ticks = els.counterTrack.querySelectorAll('.counter-tick');
      for (var k = 0; k < ticks.length; k++) ticks[k].classList.toggle('is-active', k === i);
    }

    // prev / next nav roman numerals
    var p = neighbours && neighbours.prev, nx = neighbours && neighbours.next;
    if (p && els.prevRoman) els.prevRoman.textContent = p.roman;
    if (nx && els.nextRoman) els.nextRoman.textContent = nx.roman;
  }

  // ── Mount the bare mosaic card ────────────────────────────
  var widget = window.ArcanaCards.mount(els.mount, {
    cards: cards,
    start: 0,
    bare: true,
    onCard: syncHero
  });

  // ── Ambient sparkle field around the card ─────────────────
  // Scatter small gold square glints in the space surrounding the card so the
  // title image sheds light into the layout. Denser near the card edges, sparser
  // toward the column edges; the glint phase grows with distance so the sparkle
  // reads as a wave rippling OUTWARD from the card (matching the tile dissolve).
  (function buildHeroSparkles() {
    var field = document.getElementById('heroSparkles');
    if (!field) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var N = 150;                      // sparkle count
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      // Bias positions toward the vertical centre band where the card sits.
      var x = Math.random() * 100;
      var y = 50 + (Math.random() - 0.5) * 96;   // spread across, centred
      // distance from card centre (≈ 60% across, 50% down) → drives size/phase
      var dx = (x - 60) / 50, dy = (y - 50) / 50;
      var dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      // Skip a clear zone right over the card so glints frame it, not cover it.
      if (dist < 0.28) { continue; }
      var s = document.createElement('span');
      s.className = 'hero-spark';
      // bigger near the card, smaller far out (matches tesserae size gradient)
      var size = (4.5 - dist * 3) * (0.6 + Math.random() * 0.8);
      size = Math.max(1.2, size);
      s.style.left = x.toFixed(2) + '%';
      s.style.top = y.toFixed(2) + '%';
      s.style.width = size.toFixed(1) + 'px';
      s.style.height = size.toFixed(1) + 'px';
      // brighter near the card, fainter far out
      s.style.setProperty('--sb', (0.85 - dist * 0.5).toFixed(2));
      // outward wave: nearer glints lead, far ones trail (+ jitter)
      var delay = -((1 - dist) * 0.7 + Math.random() * 0.3) * 5;
      s.style.animationDelay = delay.toFixed(2) + 's';
      frag.appendChild(s);
    }
    field.appendChild(frag);

    // Freeze the background sparkles during a card transition (the widget fires
    // these events) so they don't compete with the image swap for the main
    // thread. Resume once the new card has settled.
    document.addEventListener('arcana:transition-start', function () {
      field.classList.add('is-paused');
    });
    document.addEventListener('arcana:transition-end', function () {
      field.classList.remove('is-paused');
    });
  })();

  // ── Wire the hero's own controls to the widget ────────────
  function wirePrev(el) { el && el.addEventListener('click', function () { widget.prev(); stopAuto(); }); }
  function wireNext(el) { el && el.addEventListener('click', function () { widget.next(); stopAuto(); }); }
  wirePrev(els.navPrev);  wireNext(els.navNext);
  wirePrev(els.counterPrev); wireNext(els.counterNext);

  // ── Auto-advance (pauses on interaction / hover / tab-hide) ─
  var AUTO_MS = 5500, autoTimer = null, stopped = false;
  function startAuto() {
    if (stopped || autoTimer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    autoTimer = setInterval(function () { widget.next(); }, AUTO_MS);
  }
  function stopAuto() { stopped = true; if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
  function pauseAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  var heroRight = document.querySelector('.arcana-hero .hero-right');
  if (heroRight) {
    heroRight.addEventListener('mouseenter', pauseAuto);
    heroRight.addEventListener('mouseleave', function () { if (!stopped) startAuto(); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAuto(); else if (!stopped) startAuto();
  });
  startAuto();

})();
