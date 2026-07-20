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
      astro:    String(c.astro || '').toUpperCase(),
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
    textStack:      $('textStack'),
    cardElement:    $('cardElement'),
    cardRuler:      $('cardRuler'),
    cardSymbol:     $('cardSymbol'),
    navPrev:        $('navPrev'),
    navNext:        $('navNext'),
    prevRoman:      $('prevRoman'),
    nextRoman:      $('nextRoman'),
    gaugeTicks:     $('gaugeTicks'),
    gaugeCurrent:   $('gaugeCurrent')
  };
  if (!els.mount) return;

  var raws = raw; // keep the rich dicts for description/symbol
  var stripThe = function (n) { return String(n || '').replace(/^THE /i, ''); };

  // ── Gauge — one hairline tick per major, doubling as jump-to nav ──
  // Every fifth tick and the two endpoints are "major" graduations (taller),
  // so the row reads as a measuring scale rather than an even dot strip.
  if (els.gaugeTicks) {
    cards.forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'gauge-tick';
      b.type = 'button';
      if (i % 5 === 0 || i === cards.length - 1) b.setAttribute('data-major', '');
      b.setAttribute('aria-label', c.roman + ' — ' + c.name);
      b.setAttribute('title', c.roman + ' · ' + c.name);
      b.addEventListener('click', function () { widget && widget.go(i); stopAuto(); });
      els.gaugeTicks.appendChild(b);
    });
  }

  // ── Update the hero text column + counter for card `i` ─────
  function syncHero(card, i, neighbours) {
    var rc = raws[i] || {};
    if (els.cardNum)     els.cardNum.textContent = card.roman;
    if (els.cardTitle)   els.cardTitle.textContent = card.name;
    if (els.cardDesc)    els.cardDesc.textContent = rc.description || card.meaning || '';
    if (els.cardElement) els.cardElement.textContent = card.element;
    if (els.cardRuler)   els.cardRuler.textContent = card.astro || '—';
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

    // Gauge readout — the roman "n / XXI" label and the lit needle tick.
    if (els.gaugeCurrent) els.gaugeCurrent.textContent = card.roman;

    if (els.gaugeTicks) {
      var ticks = els.gaugeTicks.children;
      for (var k = 0; k < ticks.length; k++) {
        var on = (k === i);
        ticks[k].classList.toggle('is-active', on);
        if (on) ticks[k].setAttribute('aria-current', 'true');
        else ticks[k].removeAttribute('aria-current');
      }
    }

    // prev / next nav roman numerals
    var p = neighbours && neighbours.prev, nx = neighbours && neighbours.next;
    if (p && els.prevRoman) els.prevRoman.textContent = p.roman;
    if (nx && els.nextRoman) els.nextRoman.textContent = nx.roman;
  }

  // ── Hold the text column at its tallest ───────────────────
  // Titles run to 1 or 2 lines and descriptions to 4-6, so the stack's height
  // swings ~95px across the 22 majors — which walked the CTA button and the
  // progress track up and down as you moved through the deck. Reserve the
  // tallest state so nothing below the stack moves.
  //
  // Measured rather than hardcoded on purpose: .card-title sizes off a vw-based
  // clamp and .card-desc rewraps, so the tallest card differs at every viewport
  // width — any fixed px value would be correct at exactly one window size.
  function reserveStackHeight() {
    var stack = els.textStack;
    if (!stack || !els.cardTitle || !els.cardDesc) return;

    var saved = {
      title: els.cardTitle.textContent,
      desc:  els.cardDesc.textContent,
      el:    els.cardElement && els.cardElement.textContent,
      ruler: els.cardRuler   && els.cardRuler.textContent,
      sym:   els.cardSymbol  && els.cardSymbol.textContent
    };

    stack.style.minHeight = '0px';           // release before measuring
    var tallest = 0;
    for (var i = 0; i < cards.length; i++) {
      var rc = raws[i] || {};
      els.cardTitle.textContent = cards[i].name;
      els.cardDesc.textContent  = rc.description || cards[i].meaning || '';
      if (els.cardElement) els.cardElement.textContent = cards[i].element;
      if (els.cardRuler)   els.cardRuler.textContent   = cards[i].astro || '—';
      if (els.cardSymbol)  els.cardSymbol.textContent  = rc.symbol || '✦';
      var h = stack.getBoundingClientRect().height;
      if (h > tallest) tallest = h;
    }

    els.cardTitle.textContent = saved.title;
    els.cardDesc.textContent  = saved.desc;
    if (els.cardElement && saved.el   != null) els.cardElement.textContent = saved.el;
    if (els.cardRuler   && saved.ruler!= null) els.cardRuler.textContent   = saved.ruler;
    if (els.cardSymbol  && saved.sym  != null) els.cardSymbol.textContent  = saved.sym;

    stack.style.minHeight = Math.ceil(tallest) + 'px';
  }

  // ── Mount the bare mosaic card ────────────────────────────
  var widget = window.ArcanaCards.mount(els.mount, {
    cards: cards,
    start: 0,
    bare: true,
    onCard: syncHero
  });

  // Measure once the webfonts are in — Cinzel/EB Garamond have different metrics
  // to the fallbacks, so measuring before they land reserves the wrong height.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(reserveStackHeight);
  } else {
    reserveStackHeight();
  }
  var reserveTimer;
  window.addEventListener('resize', function () {
    clearTimeout(reserveTimer);
    reserveTimer = setTimeout(reserveStackHeight, 150);
  });

  // ── Card-transition hook ──────────────────────────────────
  // Dip the text column out so its copy swap hides inside the transition, then
  // release it on `card-swapped` — which the widget fires the moment the new
  // card is committed, while it is still hidden behind its dissolve ghost. This
  // only STARTS the clock: the actual reveal is held back by the return delay on
  // .text-stack (arcana-hero.css) so the picture changes first and the copy
  // settles in behind it. `transition-end` lands much later, once everything has
  // settled, so it is not the cue here.
  (function wireTransitionDip() {
    var heroRoot = document.querySelector('.arcana-hero');
    if (!heroRoot) return;
    document.addEventListener('arcana:transition-start', function () {
      heroRoot.classList.add('is-transitioning');
    });
    document.addEventListener('arcana:card-swapped', function () {
      heroRoot.classList.remove('is-transitioning');
    });
    // Belt and braces: if a swap ever ends without the swap event (a reduced
    // motion path, a stalled decode), never leave the copy stranded invisible.
    document.addEventListener('arcana:transition-end', function () {
      heroRoot.classList.remove('is-transitioning');
    });
  })();

  // ── Wire the hero's own controls to the widget ────────────
  function wirePrev(el) { el && el.addEventListener('click', function () { widget.prev(); stopAuto(); }); }
  function wireNext(el) { el && el.addEventListener('click', function () { widget.next(); stopAuto(); }); }
  wirePrev(els.navPrev);  wireNext(els.navNext);

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
