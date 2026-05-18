/* ============================================================
   Arcana — Card-First hero (vanilla JS)
   Drives the artwork backdrop, ghost name overlay, marginalia
   panel and filmstrip ribbon off window.ARCANA.
   ============================================================ */
(function () {
  'use strict';

  const cards = (window.ARCANA || []).filter(c => c.arcana === 'major');
  if (!cards.length) return;

  const els = {
    artwork:       document.getElementById('cfArtwork'),
    overlayName:   document.getElementById('cfOverlayName'),
    overlayNum:    document.getElementById('cfOverlayNum'),
    marginalia:    document.getElementById('cfMarginalia'),
    eyebrowCard:   document.getElementById('cfEyebrowCard'),
    kwBlock:       document.getElementById('cfKwBlock'),
    desc:          document.getElementById('cfDesc'),
    strip:         document.getElementById('cfStrip'),
    ribbonProgress: document.getElementById('cfRibbonProgress'),
    ribbonName:    document.getElementById('cfRibbonName'),
    prev:          document.getElementById('cfPrev'),
    next:          document.getElementById('cfNext'),
  };

  let idx = 0;
  let transitioning = false;

  // ── Roman numeral helper (0–21) ────────────────────────────
  const romans = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI',
                  'XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

  // ── Build filmstrip thumbs once ────────────────────────────
  function buildStrip() {
    els.strip.innerHTML = '';
    cards.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.className = 'cf-strip-card';
      btn.setAttribute('aria-label', card.name);
      const img = document.createElement('img');
      if (card.image_url) img.src = card.image_url;
      img.alt = card.name;
      btn.appendChild(img);
      btn.addEventListener('click', () => goTo(i));
      els.strip.appendChild(btn);
    });
  }

  // ── Distance-based opacity for filmstrip ───────────────────
  function updateStrip() {
    const total = cards.length;
    [...els.strip.children].forEach((thumb, i) => {
      const d = Math.min(
        Math.abs(i - idx),
        Math.abs(i - idx + total),
        Math.abs(i - idx - total)
      );
      thumb.classList.toggle('is-active', i === idx);
      thumb.style.opacity = i === idx ? '1'
        : d === 1 ? '.7'
        : d === 2 ? '.5'
        : d === 3 ? '.3'
        : '.15';
    });
    // Center the active thumb in the strip
    const active = els.strip.children[idx];
    if (active && active.scrollIntoView) {
      // Only scroll within the strip container, not the page
      const stripRect = els.strip.getBoundingClientRect();
      const thumbRect = active.getBoundingClientRect();
      const offset = (thumbRect.left + thumbRect.width / 2)
                   - (stripRect.left + stripRect.width / 2);
      els.strip.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  // ── Render current card ────────────────────────────────────
  function render() {
    const card = cards[idx];
    const upper = card.name.toUpperCase();

    // Big ghost name + number overlay
    els.overlayName.textContent = upper;
    els.overlayNum.textContent  = `·  ${card.number} / XXI  ·`;

    // Artwork backdrop
    if (card.image_url) {
      els.artwork.style.backgroundImage = `url("${card.image_url}")`;
    } else {
      els.artwork.style.backgroundImage = 'none';
    }

    // Marginalia
    const numWord = `CARD ${String(idx).padStart(2,'0')}`;
    els.eyebrowCard.textContent = numWord;

    const kws = (card.keywords_upright || []).slice(0, 3);
    els.kwBlock.innerHTML = '';
    kws.forEach(k => {
      const span = document.createElement('span');
      span.className = 'cf-kw';
      span.textContent = k + '.';
      els.kwBlock.appendChild(span);
    });

    els.desc.textContent = card.description || '';

    // Ribbon
    els.ribbonProgress.textContent =
      `${String(idx).padStart(2,'0')} / XXI`;
    els.ribbonName.textContent = upper;

    updateStrip();
  }

  // ── Transition with crossfade ──────────────────────────────
  function changeTo(newIdx) {
    if (transitioning || newIdx === idx) return;
    transitioning = true;

    els.overlayName.classList.add('is-out');
    els.marginalia.classList.add('is-out');
    els.artwork.classList.add('is-out');

    setTimeout(() => {
      idx = ((newIdx % cards.length) + cards.length) % cards.length;
      render();
      els.overlayName.classList.remove('is-out');
      els.marginalia.classList.remove('is-out');
      els.artwork.classList.remove('is-out');
      transitioning = false;
    }, 280);
  }

  const next = () => changeTo(idx + 1);
  const prev = () => changeTo(idx - 1);
  const goTo = (i) => changeTo(i);

  // ── Wire up ────────────────────────────────────────────────
  els.next.addEventListener('click', next);
  els.prev.addEventListener('click', prev);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });

  // ── Initial ────────────────────────────────────────────────
  buildStrip();
  render();
})();
