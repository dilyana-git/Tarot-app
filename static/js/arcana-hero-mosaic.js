/* ============================================================
   Arcana — Home hero controller (mosaic edition)

   Mounts the framework-free mosaic-tiling card (arcana-card.js) inside the
   home page's round .main-card frame, and drives the surrounding hero UI —
   the left text column, the progress counter, the nav buttons — from the
   widget's onCard callback. Replaces the old oval-crossfade arcana-hero.js.

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

  // ── Card-transition hook ──────────────────────────────────
  // Dip the text column out while the card dissolves so its copy swap hides
  // inside the transition; restore once the new card has settled.
  (function wireTransitionDip() {
    var heroRoot = document.querySelector('.arcana-hero');
    if (!heroRoot) return;
    document.addEventListener('arcana:transition-start', function () {
      heroRoot.classList.add('is-transitioning');
    });
    document.addEventListener('arcana:transition-end', function () {
      heroRoot.classList.remove('is-transitioning');
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
