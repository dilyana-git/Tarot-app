/* ============================================================
   Arcana — Architectural hero (vanilla JS)
   v3 — replaces the two-phase flip with a TWO-LAYER crossfade
        that animates with subtle 3D rotation. The new image is
        present in the DOM and visible from frame 1, so there's
        no perceptual "wait for edge-on" lag.

   Reads window.ARCANA (injected by Flask) and drives the DOM
   declared in templates/index.html.
   ============================================================ */
(function () {
  'use strict';

  const cards = (window.ARCANA || []).filter(c => c.arcana === 'major');
  if (!cards.length) return;

  // ── DOM refs ──────────────────────────────────────────────
  const els = {
    textStack:   document.getElementById('textStack'),
    cardNum:     document.getElementById('cardNum'),
    cardTitle:   document.getElementById('cardTitle'),
    cardRoman:   document.getElementById('cardRoman'),
    kwRow:       document.getElementById('kwRow'),
    cardDesc:    document.getElementById('cardDesc'),
    cardElement: document.getElementById('cardElement'),
    cardSymbol:  document.getElementById('cardSymbol'),

    mainCard:    document.getElementById('mainCard'),
    mainImg:     document.getElementById('mainImg'),
    mainLabel:   document.getElementById('mainLabel'),
    mainCardWrap: document.querySelector('.main-card-wrap'),

    navPrev:     document.getElementById('navPrev'),
    navNext:     document.getElementById('navNext'),
    prevImg:     document.getElementById('prevImg'),
    nextImg:     document.getElementById('nextImg'),
    prevLabel:   document.getElementById('prevLabel'),
    nextLabel:   document.getElementById('nextLabel'),
    prevChevron: document.getElementById('prevChevron'),
    nextChevron: document.getElementById('nextChevron'),
    prevCircle:  document.querySelector('.nav-btn-prev .nav-btn-circle'),
    nextCircle:  document.querySelector('.nav-btn-next .nav-btn-circle'),

    counterIdx:     document.getElementById('counterIdx'),
    counterFill:    document.getElementById('counterFill'),
    counterTrack:   document.getElementById('counterTrack'),
    counterPrev:    document.getElementById('counterPrev'),
    counterNext:    document.getElementById('counterNext'),
    counterCaption: document.getElementById('counterCaption'),
  };

  // The template ships <img id="mainImg"> directly inside .main-card.
  // Wrap it in a .main-card-layer so every image — including the initial
  // one — lives in the same layer structure. We keep a pointer to the
  // currently-displayed layer and swap it on each change.
  let currentLayer = (function bootstrapLayer() {
    const layer = document.createElement('div');
    layer.className = 'main-card-layer';
    els.mainImg.parentNode.insertBefore(layer, els.mainImg);
    layer.appendChild(els.mainImg);
    return layer;
  })();

  let idx = 0;
  let transitioning = false;

  // ── Timing constants ──────────────────────────────────────
  const SWAP_MS    = 380;   // image layer crossfade duration
  const SHIMMER_MS = 700;
  const AUTO_MS    = 5000;  // ms between auto-advances

  let autoTimer  = null;
  let isPaused   = false;

  // ── Image preloading ──────────────────────────────────────
  // Warm the browser cache AND pre-decode every major arcana image so
  // when we mount the incoming layer it paints on the very first frame.
  const preloaded = cards.map(c => {
    if (!c.image_url) return null;
    const im = new Image();
    im.decoding = 'async';
    im.src = c.image_url;
    if (im.decode) im.decode().catch(() => {});
    return im;
  });

  // ── Build progress ticks once ─────────────────────────────
  cards.forEach((_, i) => {
    const tick = document.createElement('button');
    tick.className = 'counter-tick';
    tick.style.left = `${(i / (cards.length - 1)) * 100}%`;
    tick.setAttribute('aria-label', cards[i].name);
    tick.setAttribute('title', cards[i].name);
    tick.addEventListener('click', () => goTo(i));
    els.counterTrack.appendChild(tick);
  });

  // ── Traveling orbs along multiple orbit rings ─────────────
  // Eight small gold orbs orbiting at distinct radii — some on
  // the visible SVG ellipses, others on invisible intermediate
  // paths. Each has its own speed, phase and direction so the
  // motion reads as cosmic depth, not flat rotation.
  // Mystical, slow, soft — same single-dot-with-halo style as
  // before, just MORE orbits at MORE radii.
  // Pure JS; the template SVG is not modified.
  (function setupOrbitOrbs() {
    const svg = document.querySelector('.arcana-hero .orbit-svg');
    if (!svg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const NS = 'http://www.w3.org/2000/svg';
    const ellipses = Array.from(svg.querySelectorAll('ellipse'));
    if (!ellipses.length) return;

    // Borrow the center from the existing ellipses
    const cx = parseFloat(ellipses[0].getAttribute('cx'));
    const cy = parseFloat(ellipses[0].getAttribute('cy'));

    // Orbital radii spanning inside, on, and outside the visible
    // rings (which sit at rx≈220/260/300, ry≈240/265/295).
    // Slight rx/ry variation keeps each orbit visually distinct.
    const orbits = [
      { rx: 175, ry: 195, size: 1.8, speed: 0.00060, phase: 0.30, dir:  1 },
      { rx: 205, ry: 222, size: 2.2, speed: 0.00050, phase: 1.90, dir: -1 },
      { rx: 235, ry: 250, size: 1.9, speed: 0.00040, phase: 3.10, dir:  1 },
      { rx: 268, ry: 270, size: 2.6, speed: 0.00034, phase: 0.90, dir: -1 },
      { rx: 290, ry: 285, size: 2.0, speed: 0.00030, phase: 4.20, dir:  1 },
      { rx: 315, ry: 305, size: 2.4, speed: 0.00026, phase: 2.40, dir: -1 },
      { rx: 345, ry: 325, size: 1.8, speed: 0.00022, phase: 5.50, dir:  1 },
      { rx: 375, ry: 345, size: 2.2, speed: 0.00019, phase: 1.10, dir: -1 },
    ];

    const orbs = orbits.map(o => {
      // Faint halo trails one step behind the orb — soft comet tail
      const halo = document.createElementNS(NS, 'circle');
      halo.classList.add('orbit-dot');
      halo.setAttribute('r', String(o.size + 3));
      halo.setAttribute('fill', 'rgba(232,200,136,.16)');
      halo.style.pointerEvents = 'none';
      svg.appendChild(halo);

      const orb = document.createElementNS(NS, 'circle');
      orb.classList.add('orbit-dot');
      orb.setAttribute('r', String(o.size));
      orb.setAttribute('fill', '#e8c888');
      orb.setAttribute('opacity', '0.9');
      orb.style.filter = 'drop-shadow(0 0 5px rgba(232,200,136,.85))';
      orb.style.pointerEvents = 'none';
      svg.appendChild(orb);

      return Object.assign({ orb, halo, cx, cy, haloLag: 0.18 }, o);
    });

    let lastT = 0;
    function tick(t) {
      // Skip first frame so we don't spike on first sample
      if (!lastT) { lastT = t; requestAnimationFrame(tick); return; }
      orbs.forEach(o => {
        const a  = (t * o.speed * o.dir) + o.phase;
        const ah = a - (o.haloLag * o.dir);
        o.orb.setAttribute('cx',  o.cx + o.rx * Math.cos(a));
        o.orb.setAttribute('cy',  o.cy + o.ry * Math.sin(a));
        o.halo.setAttribute('cx', o.cx + o.rx * Math.cos(ah));
        o.halo.setAttribute('cy', o.cy + o.ry * Math.sin(ah));
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  function stripThe(name) { return name.replace(/^The /, ''); }

  // ── Render data-driven UI (everything except the main image,
  //    which is handled by the layer crossfade in changeTo). ─
  function render() {
    const card = cards[idx];
    const prev = cards[(idx - 1 + cards.length) % cards.length];
    const next = cards[(idx + 1) % cards.length];

    els.cardNum.textContent     = String(idx).padStart(2, '0');
    els.cardTitle.textContent   = card.name.toUpperCase();
    if (els.cardRoman) els.cardRoman.textContent = `·  ${card.number}  ·`;
    els.cardDesc.textContent    = card.description || '';
    els.cardElement.textContent = (card.element || '').toUpperCase();
    els.cardSymbol.textContent  = card.symbol || '';

    els.kwRow.innerHTML = '';
    (card.keywords_upright || []).slice(0, 3).forEach((k, i) => {
      if (i > 0) {
        const d = document.createElement('span');
        d.className = 'kw-diamond';
        els.kwRow.appendChild(d);
      }
      const span = document.createElement('span');
      span.className = 'kw';
      span.textContent = k.toUpperCase();
      els.kwRow.appendChild(span);
    });

    els.mainLabel.textContent = `· ${card.name.toUpperCase()} ·`;
    els.mainLabel.href = `/card/${card.id}`;

    if (prev.image_url) els.prevImg.src = prev.image_url;
    if (next.image_url) els.nextImg.src = next.image_url;
    els.prevLabel.textContent = stripThe(prev.name).toUpperCase();
    els.nextLabel.textContent = stripThe(next.name).toUpperCase();
    els.prevChevron.textContent = `← ${prev.number}`;
    els.nextChevron.textContent = `${next.number} →`;
    els.navPrev.setAttribute('aria-label', `Previous: ${prev.name}`);
    els.navNext.setAttribute('aria-label', `Next: ${next.name}`);

    els.counterIdx.textContent = String(idx).padStart(2, '0');
    els.counterFill.style.width =
      `${((idx + 1) / cards.length) * 100}%`;
    els.counterTrack.querySelectorAll('.counter-tick').forEach((t, i) => {
      t.classList.toggle('is-active', i === idx);
    });
    els.counterCaption.textContent =
      `${card.name.toUpperCase()} · CARD ${String(idx).padStart(2,'0')} OF XXI`;
  }

  // ── Helper: spawn a one-shot shimmer pulse on the card wrap
  function spawnShimmer() {
    const pulse = document.createElement('div');
    pulse.className = 'shimmer-pulse';
    els.mainCardWrap.appendChild(pulse);
    setTimeout(() => pulse.remove(), SHIMMER_MS + 50);
  }

  function popSatellite(circle) {
    if (!circle) return;
    circle.classList.remove('is-changing');
    void circle.offsetWidth;
    circle.classList.add('is-changing');
    setTimeout(() => circle.classList.remove('is-changing'), 600);
  }

  function popActiveTick() {
    const tick = els.counterTrack.querySelector(
      `.counter-tick:nth-child(${idx + 1})`
    );
    if (!tick) return;
    tick.classList.remove('just-activated');
    void tick.offsetWidth;
    tick.classList.add('just-activated');
    setTimeout(() => tick.classList.remove('just-activated'), 650);
  }

  // ── Direction-aware card change ──────────────────────────
  // Image layers crossfade SIMULTANEOUSLY:
  //   * The incoming layer is appended BEHIND the current one with the
  //     new image already loaded — visible from frame 1.
  //   * The current layer animates out (rotateY + fade + soft blur).
  //   * The incoming layer animates in (rotateY from the opposite side
  //     + fade + soft blur).
  //   * Text + label + satellite circles + counter tick respond on a
  //     short delay so the eye lands on the new image first.
  function changeTo(newIdx) {
    if (transitioning) return;
    newIdx = ((newIdx % cards.length) + cards.length) % cards.length;
    if (newIdx === idx) return;
    transitioning = true;

    // Direction: going from XXI → 0 still feels like "next".
    const delta = newIdx - idx;
    const goingNext =
      (delta > 0 && delta <  cards.length / 2) ||
      (delta < 0 && delta < -cards.length / 2);
    const dirClass = goingNext ? '' : 'dir-prev';

    idx = newIdx;
    const card = cards[idx];

    // 1) Build the incoming layer with the pre-decoded image.
    const newLayer = document.createElement('div');
    newLayer.className = 'main-card-layer';
    const newImgEl = document.createElement('img');
    if (card.image_url) {
      newImgEl.src = card.image_url;
      newImgEl.alt = card.name;
    }
    newImgEl.decoding = 'async';
    newLayer.appendChild(newImgEl);
    els.mainCard.insertBefore(newLayer, currentLayer);

    // 2) Decorative effects fire alongside the crossfade.
    els.mainCardWrap.classList.add('is-flipping');
    spawnShimmer();

    // 3) Trigger crossfade on the next frame so the browser applies the
    //    initial transform before keyframes start.
    const outgoing = currentLayer;
    requestAnimationFrame(() => {
      outgoing.classList.add('is-out');
      newLayer.classList.add('is-in');
      if (dirClass) {
        outgoing.classList.add(dirClass);
        newLayer.classList.add(dirClass);
      }
    });

    // 4) Text + label crossfade with a tiny delay so eye lands on
    //    the new image first.
    els.textStack.classList.add('is-out');
    if (dirClass) els.textStack.classList.add(dirClass);
    els.textStack.classList.remove('is-in');
    els.mainLabel.classList.add('is-out');

    setTimeout(() => {
      render();
      popSatellite(els.prevCircle);
      popSatellite(els.nextCircle);
      popActiveTick();
      els.textStack.classList.remove('is-out');
      els.textStack.classList.add('is-in');
      els.mainLabel.classList.remove('is-out');
    }, 90);

    // 5) Cleanup once the layer crossfade finishes.
    currentLayer = newLayer;
    setTimeout(() => {
      if (outgoing && outgoing.parentNode) outgoing.remove();
      els.mainCardWrap.classList.remove('is-flipping');
      els.textStack.classList.remove('is-in', 'dir-prev');
      newLayer.classList.remove('is-in', 'dir-prev');
      transitioning = false;
    }, SWAP_MS + 40);
  }

  const next = () => { changeTo(idx + 1); resetAuto(); };
  const prev = () => { changeTo(idx - 1); resetAuto(); };
  const goTo = (i) => { changeTo(i);     resetAuto(); };

  // ── Auto-advance ─────────────────────────────────────────
  function startAuto() {
    stopAuto();
    if (isPaused) return;
    autoTimer = setInterval(() => {
      if (!isPaused && !transitioning) next();
    }, AUTO_MS);
  }
  function stopAuto()  { clearInterval(autoTimer); autoTimer = null; }
  function resetAuto() { stopAuto(); startAuto(); }

  // Pause when the pointer is over the hero; resume when it leaves.
  const heroRoot = document.querySelector('.arcana-hero');
  if (heroRoot) {
    heroRoot.addEventListener('mouseenter', () => { isPaused = true;  stopAuto(); });
    heroRoot.addEventListener('mouseleave', () => { isPaused = false; startAuto(); });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto();
    else if (!isPaused)  startAuto();
  });

  // ── Wire up events ───────────────────────────────────────
  els.navNext.addEventListener('click',     next);
  els.navPrev.addEventListener('click',     prev);
  els.counterNext.addEventListener('click', next);
  els.counterPrev.addEventListener('click', prev);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight')     next();
    else if (e.key === 'ArrowLeft') prev();
  });

  // Initial render
  render();
  // Set the initial image (the bootstrapped layer's img element)
  if (cards[0].image_url) {
    els.mainImg.src = cards[0].image_url;
    els.mainImg.alt = cards[0].name;
  }
  startAuto();
})();
