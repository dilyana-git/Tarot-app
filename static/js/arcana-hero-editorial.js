/* ============================================================
   Arcana — Editorial Spread hero (vanilla JS)
   Drives the plate, folio bar, drop-cap body, kw table, and
   prev/next thumb navigation off window.ARCANA.
   ============================================================ */
(function () {
  'use strict';

  const cards = (window.ARCANA || []).filter(c => c.arcana === 'major');
  if (!cards.length) return;

  const romans = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI',
                  'XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

  const romanWords = {
    '0': 'ZERO', 'I': 'ONE', 'II': 'TWO', 'III': 'THREE', 'IV': 'FOUR',
    'V': 'FIVE', 'VI': 'SIX', 'VII': 'SEVEN', 'VIII': 'EIGHT', 'IX': 'NINE',
    'X': 'TEN', 'XI': 'ELEVEN', 'XII': 'TWELVE', 'XIII': 'THIRTEEN',
    'XIV': 'FOURTEEN', 'XV': 'FIFTEEN', 'XVI': 'SIXTEEN', 'XVII': 'SEVENTEEN',
    'XVIII': 'EIGHTEEN', 'XIX': 'NINETEEN', 'XX': 'TWENTY', 'XXI': 'TWENTY-ONE'
  };

  const els = {
    folioPlate: document.getElementById('edFolioPlate'),
    plateNo:    document.getElementById('edPlateNo'),
    cardTitle:  document.getElementById('edCardTitle'),
    cardSub:    document.getElementById('edCardSub'),
    keywords:   document.getElementById('edKeywords'),
    element:    document.getElementById('edElement'),
    symbol:     document.getElementById('edSymbol'),
    dropcap:    document.getElementById('edDropcap'),
    bodyText:   document.getElementById('edBodyText'),
    textCol:    document.querySelector('.ed-text-col'),
    plateInner: document.getElementById('edPlateInner'),
    plateImg:   document.getElementById('edPlateImg'),
    plateLink:  document.getElementById('edPlateLink'),
    plateCapL:  document.getElementById('edPlateCapL'),
    plateCapR:  document.getElementById('edPlateCapR'),
    prev:       document.getElementById('edPrev'),
    next:       document.getElementById('edNext'),
    prevImg:    document.getElementById('edPrevImg'),
    nextImg:    document.getElementById('edNextImg'),
    prevTxt:    document.getElementById('edPrevTxt'),
    nextTxt:    document.getElementById('edNextTxt'),
    pageCur:    document.getElementById('edPageCur'),
    barFill:    document.getElementById('edBarFill'),
    railText:   document.getElementById('edRailText'),
    railFolio:  document.getElementById('edRailFolio'),
  };

  let idx = 0;
  let transitioning = false;

  function render() {
    const card = cards[idx];
    const prev = cards[(idx - 1 + cards.length) % cards.length];
    const next = cards[(idx + 1) % cards.length];

    const upper   = card.name.toUpperCase();
    const num2    = String(idx).padStart(2, '0');
    const numWord = romanWords[card.number] || card.number;

    // Folio bar (right side) + plate number
    els.folioPlate.textContent = `PLATE ${num2}`;
    els.plateNo.textContent    = `PLATE ${num2} · MAJOR ARCANA`;

    // Title block
    els.cardTitle.textContent  = card.name;
    els.cardSub.textContent    =
      idx === 0 ? '— the unnumbered card'
                : `— the ${numWord.toLowerCase()} card`;

    // KW table
    const kws = (card.keywords_upright || []).slice(0, 3);
    els.keywords.textContent = kws.join(' · ').toUpperCase();
    els.element.textContent  = (card.element || '').toUpperCase();
    els.symbol.textContent   = card.symbol || '✦';

    // Drop-cap body
    const body = card.description || '';
    if (body) {
      els.dropcap.textContent  = body.charAt(0);
      els.bodyText.textContent = body.slice(1);
    } else {
      els.dropcap.textContent  = card.name.charAt(0);
      els.bodyText.textContent = '';
    }

    // Plate
    if (card.image_url) {
      els.plateImg.src = card.image_url;
      els.plateImg.alt = card.name;
    } else {
      els.plateImg.removeAttribute('src');
    }
    els.plateLink.href = '/card/' + card.id;
    els.plateCapL.textContent = `PL. ${num2}`;
    els.plateCapR.textContent = `FIG. ${card.number || '0'} — ${upper}`;

    // Prev/next thumbs
    if (prev.image_url) els.prevImg.src = prev.image_url;
    if (next.image_url) els.nextImg.src = next.image_url;
    els.prevTxt.textContent = `← ${prev.number || '0'}`;
    els.nextTxt.textContent = `${next.number || '0'} →`;

    // Bottom pagination
    els.pageCur.textContent = num2;
    els.barFill.style.width = (((idx + 1) / cards.length) * 100) + '%';

    // Right rail running headline
    els.railText.textContent = `FOL. ${num2} — ${upper} — ${numWord}`;
    els.railFolio.textContent = card.number || '0';
  }

  function changeTo(newIdx) {
    if (transitioning) return;
    newIdx = ((newIdx % cards.length) + cards.length) % cards.length;
    if (newIdx === idx) return;
    transitioning = true;

    els.textCol.classList.add('is-out');
    els.plateInner.classList.add('is-out');

    setTimeout(() => {
      idx = newIdx;
      render();
      els.textCol.classList.remove('is-out');
      els.plateInner.classList.remove('is-out');
      transitioning = false;
    }, 240);
  }

  els.next.addEventListener('click', () => changeTo(idx + 1));
  els.prev.addEventListener('click', () => changeTo(idx - 1));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') changeTo(idx + 1);
    else if (e.key === 'ArrowLeft') changeTo(idx - 1);
  });

  render();
})();
