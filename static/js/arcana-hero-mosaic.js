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

    var N = 260;                      // sparkle count
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
      s.style.setProperty('--sb', (1.0 - dist * 0.4).toFixed(2));
      // Per-glint period so the field twinkles organically, not in lockstep.
      var dur = 4 + Math.random() * 3;
      s.style.animationDuration = dur.toFixed(2) + 's';
      // outward wave: nearer glints lead, far ones trail (+ jitter)
      var delay = -((1 - dist) * 0.7 + Math.random() * 0.3) * dur;
      s.style.animationDelay = delay.toFixed(2) + 's';
      frag.appendChild(s);
    }
    field.appendChild(frag);

    // ── Edge dissolve: tesserae drifting off the card into the void ─────────
    // A delicate, ambient echo of the demo's "edge crumble" — a sparse handful
    // of gold mosaic chips detach near the card's edge and drift slowly outward
    // (with a faint upward rise), fading as they go, mirroring the card's own
    // static crumble band. Emission is biased toward the open void to the card's
    // right and top so chips never wander over the left text column, and the
    // motion is slow/faint so the focus stays on the card. Pure CSS
    // transform+opacity animation (no rAF); appended to the same field so the
    // transition pause below covers it too.
    (function buildDrift() {
      var DRIFT_N = 130;
      var dfrag = document.createDocumentFragment();
      for (var d = 0; d < DRIFT_N; d++) {
        // Bias the emission angle toward rightward + upward (the open void),
        // away from the text column on the card's left.
        var ang = 0;
        for (var tries = 0; tries < 8; tries++) {
          ang = Math.random() * Math.PI * 2;
          var favor = 0.5 + 0.35 * Math.cos(ang) + 0.25 * (-Math.sin(ang));
          if (Math.random() < favor) break;
        }
        // Start on a ring hugging the card edge (just past the clear zone), in
        // the same 60%/50%-centred field space the sparkles use.
        var r0 = 0.30 + Math.random() * 0.75;
        var sx = 60 + Math.cos(ang) * r0 * 50;
        var sy = 50 + Math.sin(ang) * r0 * 50;
        if (sx < 1 || sx > 99 || sy < 1 || sy > 99) { continue; }
        // Gentle outward reach + a small upward rise, like embers off the edge.
        var reach = 24 + Math.random() * 44;
        var dx2 = Math.cos(ang) * reach;
        var dy2 = Math.sin(ang) * reach - (8 + Math.random() * 16);
        var size = 2.2 + Math.random() * 2.4;
        var dur = 6.5 + Math.random() * 4;
        var chip = document.createElement('span');
        chip.className = 'hero-drift';
        chip.style.left = sx.toFixed(2) + '%';
        chip.style.top = sy.toFixed(2) + '%';
        chip.style.width = size.toFixed(1) + 'px';
        chip.style.height = size.toFixed(1) + 'px';
        chip.style.setProperty('--dx', dx2.toFixed(1) + 'px');
        chip.style.setProperty('--dy', dy2.toFixed(1) + 'px');
        chip.style.setProperty('--rot', ((Math.random() - 0.5) * 46).toFixed(0) + 'deg');
        chip.style.setProperty('--peak', (0.30 + Math.random() * 0.24).toFixed(2));
        chip.style.animationDuration = dur.toFixed(2) + 's';
        chip.style.animationDelay = (-Math.random() * dur).toFixed(2) + 's';
        dfrag.appendChild(chip);
      }
      field.appendChild(dfrag);
    })();

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
