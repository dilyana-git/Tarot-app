/*! ARCANA — interactive Major Arcana card (framework-free)
 *  Drop-in for any page (Flask/Jinja, plain HTML, etc). Pairs with
 *  arcana-card.css. No dependencies, no build step.
 *
 *  Usage A (auto-init):
 *    <div data-arcana-card data-start="1">
 *      <script type="application/json"> [ ...cards... ] </script>
 *    </div>
 *  Usage B (manual):
 *    ArcanaCards.mount(document.querySelector('#hero'), { cards: [...], start: 1 });
 *
 *  Card shape: { id, roman, num, name, element, keywords:[...], meaning, image }
 *    - image: URL to the card art (recommended aspect 320:470). If omitted, a
 *      built-in placeholder illustration is generated for that card id.
 *    - The foil / tilt / edge-dissolve / light effects are art-agnostic: they
 *      operate on whatever `image` you supply.
 */
(function (global) {
  "use strict";

const CARDS = [
  {
    id: "world", roman: "XXI", num: "21", name: "THE WORLD",
    keywords: ["COMPLETION", "INTEGRATION", "FULFILMENT"], element: "EARTH", seed: 7,
    meaning:
      "The journey closes and completes. Integration, fulfilment, and the quiet mastery of having become whole — before the wheel turns once more and the wanderer sets out again.",
  },
  {
    id: "fool", roman: "0", num: "00", name: "THE FOOL",
    keywords: ["BEGINNINGS", "SPONTANEITY", "INNOCENCE"], element: "AIR", seed: 19,
    meaning:
      "At the threshold of a new cycle, the Fool steps into open air — a leap taken not from recklessness but from trust that the ground will rise to meet the foot.",
  },
  {
    id: "magician", roman: "I", num: "01", name: "THE MAGICIAN",
    keywords: ["WILL", "MANIFESTATION", "POWER"], element: "AIR", seed: 31,
    meaning:
      "All the elements lie ready upon the table; the will to shape them is yours. The Magician is the channel through which intention becomes form. As above, so below.",
  },
];

/* ---------- deterministic RNG + stars ---------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function makeStars(seed, count) {
  const r = rng(seed); const a = [];
  for (let i = 0; i < count; i++)
    a.push({
      x: +(r() * 320).toFixed(1), y: +(r() * 470).toFixed(1),
      r: +(0.35 + r() * 1.5).toFixed(2), o: +(0.22 + r() * 0.7).toFixed(2),
    });
  return a;
}
function starsSVG(seed) {
  return makeStars(seed, 56).map((s) => {
    const halo = s.r > 1.15
      ? `<circle cx="${s.x}" cy="${s.y}" r="${(s.r * 3).toFixed(2)}" fill="#f6e4b0" opacity="${(s.o * 0.18).toFixed(3)}"/>`
      : "";
    return `${halo}<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#f6e4b0" opacity="${s.o}"/>`;
  }).join("");
}
const gold = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4e2a8"/><stop offset=".5" stop-color="#cda14e"/><stop offset="1" stop-color="#8a6a2c"/></linearGradient>`;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 470" preserveAspectRatio="xMidYMid slice">`;

/* ============================ CARD ART (strings) ======================== */
function foolSVG() {
  return `${SVG_OPEN}
<defs>
<linearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1736"/><stop offset=".55" stop-color="#070b1c"/><stop offset="1" stop-color="#05060e"/></linearGradient>
<radialGradient id="f-dawn" cx="62%" cy="24%" r="55%"><stop offset="0" stop-color="#f6dfa0" stop-opacity=".55"/><stop offset="40%" stop-color="#c9962f" stop-opacity=".16"/><stop offset="100%" stop-color="#c9962f" stop-opacity="0"/></radialGradient>
${gold("f-gold")}
<linearGradient id="f-cloak" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c878"/><stop offset=".45" stop-color="#7d83a6"/><stop offset="1" stop-color="#223a66"/></linearGradient>
<radialGradient id="f-vig" cx="50%" cy="44%" r="62%"><stop offset="56%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".6"/></radialGradient>
</defs>
<rect width="320" height="470" fill="url(#f-sky)"/>
<ellipse cx="200" cy="116" rx="150" ry="120" fill="url(#f-dawn)"/>
${starsSVG(19)}
<path d="M0,470 L0,402 C40,398 60,392 96,408 C130,422 150,408 196,404 C235,400 270,416 320,398 L320,470 Z" fill="url(#f-gold)"/>
<path d="M0,470 L0,432 C60,426 120,438 196,432 C250,428 290,438 320,430 L320,470 Z" fill="#000" opacity=".22"/>
<circle cx="44" cy="432" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="78" cy="446" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="150" cy="438" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="214" cy="446" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="262" cy="436" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="300" cy="450" r="1.7" fill="#f6e4b0" opacity=".7"/>
<path d="M176,150 C168,150 162,156 160,168 C156,196 150,250 150,300 C150,330 140,352 96,372 C76,381 70,388 86,392 C120,400 168,404 196,402 C240,399 262,388 244,372 C214,348 214,330 214,300 C214,250 210,196 206,168 C204,156 198,150 190,150 Z" fill="url(#f-cloak)"/>
<path d="M206,168 C210,196 214,250 214,300 C214,330 214,350 244,372" fill="none" stroke="#f4e2a8" stroke-opacity=".5" stroke-width="1.6"/>
<ellipse cx="183" cy="139" rx="12.5" ry="14" fill="#ecc97d"/>
<path d="M171,135 C174,127 192,127 195,136 C190,132 176,132 171,135 Z" fill="#b79447"/>
<line x1="206" y1="176" x2="252" y2="118" stroke="#e8c977" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="255" cy="113" r="7" fill="#d9b65f"/>
<path d="M249,108 q6,-7 12,0 q-6,5 -12,0 Z" fill="#c79f4e"/>
<path d="M104,393 C100,387 105,382 112,383 C115,378 122,378 124,383 C131,382 136,386 134,392 C140,393 138,398 132,398 L110,398 C104,398 102,395 104,393 Z" fill="#f1ece0"/>
<path d="M123,383 l5,-5 l1,7 Z" fill="#f1ece0"/>
<path d="M104,393 l-7,-1 l6,4 Z" fill="#f1ece0"/>
<circle cx="132" cy="389" r="1.3" fill="#3a3a3a"/>
<rect x="115" y="390" width="9" height="2.3" rx="1.1" fill="#9c2b2b"/>
<rect width="320" height="470" fill="url(#f-vig)"/>
</svg>`;
}

function magicianSVG() {
  const suits = `
<circle cx="122" cy="349" r="5" fill="none" stroke="#f6e4b0" stroke-width="1.3"/><path d="M122,345 L125.8,352 L117.3,347.8 L126.7,347.8 L118.2,352 Z" fill="none" stroke="#f6e4b0" stroke-width="0.9"/>
<path d="M143,345 a5,4 0 0 0 10,0 Z M148,349 v4 M145,353 h6" fill="none" stroke="#f6e4b0" stroke-width="1.3" stroke-linecap="round"/>
<path d="M176,344 v9 M172,348 h8" fill="none" stroke="#f6e4b0" stroke-width="1.3" stroke-linecap="round"/>
<line x1="198" y1="353" x2="206" y2="344" stroke="#f6e4b0" stroke-width="1.3" stroke-linecap="round"/>`;
  return `${SVG_OPEN}
<defs>
<linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1140"/><stop offset=".55" stop-color="#0a0720"/><stop offset="1" stop-color="#06040e"/></linearGradient>
<radialGradient id="m-neb" cx="50%" cy="26%" r="55%"><stop offset="0" stop-color="#7d4fd0" stop-opacity=".4"/><stop offset="100%" stop-color="#7d4fd0" stop-opacity="0"/></radialGradient>
<linearGradient id="m-robe" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c878"/><stop offset=".45" stop-color="#7a5bb0"/><stop offset="1" stop-color="#2a1c4a"/></linearGradient>
${gold("m-gold")}
<radialGradient id="m-vig" cx="50%" cy="46%" r="62%"><stop offset="56%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".62"/></radialGradient>
</defs>
<rect width="320" height="470" fill="url(#m-sky)"/>
<ellipse cx="160" cy="120" rx="155" ry="135" fill="url(#m-neb)"/>
${starsSVG(31)}
<path d="M140,116 C140,104 152,104 160,116 C168,128 180,128 180,116 C180,104 168,104 160,116 C152,128 140,128 140,116 Z" fill="none" stroke="#f4e2a8" stroke-width="2.4" stroke-opacity=".92"/>
<line x1="205" y1="118" x2="205" y2="78" stroke="#f4e2a8" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="205" cy="74" r="12" fill="#f6e4b0" opacity=".25"/>
<circle cx="205" cy="74" r="5.5" fill="#f6e4b0"/>
<path d="M176,176 C186,168 196,150 205,122 C209,124 211,126 213,124 C207,154 197,178 185,190 Z" fill="url(#m-robe)"/>
<path d="M160,150 C150,150 146,158 145,172 C141,210 132,300 120,360 C116,380 130,386 160,386 C190,386 204,380 200,360 C188,300 179,210 175,172 C174,158 170,150 160,150 Z" fill="url(#m-robe)"/>
<path d="M147,178 C140,196 130,236 120,262 C118,266 122,270 126,266 C140,238 150,206 156,186 Z" fill="url(#m-robe)"/>
<ellipse cx="160" cy="139" rx="12.5" ry="14" fill="#ecc97d"/>
<rect x="100" y="356" width="120" height="15" rx="3" fill="url(#m-gold)"/>
<rect x="100" y="356" width="120" height="15" rx="3" fill="#000" opacity=".12"/>
${suits}
<rect width="320" height="470" fill="url(#m-vig)"/>
</svg>`;
}

function worldSVG() {
  const cx = 160, cy = 236, rx = 96, ry = 150;
  let rays = "";
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    rays += `<line x1="${(cx + Math.cos(a) * 30).toFixed(1)}" y1="${(cy + Math.sin(a) * 40).toFixed(1)}" x2="${(cx + Math.cos(a) * 168).toFixed(1)}" y2="${(cy + Math.sin(a) * 220).toFixed(1)}" stroke="#f6e4b0" stroke-width="0.7" opacity=".10"/>`;
  }
  let leaves = "";
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry, nx = Math.cos(a), ny = Math.sin(a);
    leaves += `<line x1="${(px - nx * 5).toFixed(1)}" y1="${(py - ny * 5).toFixed(1)}" x2="${(px + nx * 7).toFixed(1)}" y2="${(py + ny * 7).toFixed(1)}" stroke="#cda14e" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
  }
  return `${SVG_OPEN}
<defs>
<linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08231c"/><stop offset=".55" stop-color="#061018"/><stop offset="1" stop-color="#04060c"/></linearGradient>
${gold("w-gold")}
<radialGradient id="w-burst" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f6e4b0" stop-opacity=".22"/><stop offset="100%" stop-color="#f6e4b0" stop-opacity="0"/></radialGradient>
<radialGradient id="w-vig" cx="50%" cy="48%" r="62%"><stop offset="56%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".62"/></radialGradient>
</defs>
<rect width="320" height="470" fill="url(#w-sky)"/>
${starsSVG(7)}
<ellipse cx="160" cy="236" rx="150" ry="180" fill="url(#w-burst)"/>
${rays}
<ellipse cx="160" cy="236" rx="96" ry="150" fill="none" stroke="url(#w-gold)" stroke-width="9" opacity=".92"/>
${leaves}
<path d="M148,86 l-10,12 l12,4 Z M172,86 l10,12 l-12,4 Z" fill="#cda14e" opacity=".85"/>
<path d="M148,386 l-10,-12 l12,-4 Z M172,386 l10,-12 l-12,-4 Z" fill="#cda14e" opacity=".85"/>
<ellipse cx="160" cy="158" rx="11" ry="12.5" fill="#ecc97d"/>
<path d="M160,170 C153,170 150,178 151,190 C153,214 150,240 150,262 C150,284 146,296 144,312 C143,318 149,320 152,314 C156,298 159,284 160,268 C161,284 162,300 168,316 C171,322 177,318 175,312 C171,294 169,282 169,260 C169,238 168,214 169,190 C170,178 167,170 160,170 Z" fill="url(#w-gold)"/>
<path d="M154,196 C142,192 126,182 116,170 C113,172 113,176 116,178 C128,190 142,200 152,206 Z" fill="url(#w-gold)"/>
<path d="M166,198 C178,194 192,188 202,178 C205,180 205,184 202,186 C190,196 178,204 168,208 Z" fill="url(#w-gold)"/>
<line x1="112" y1="168" x2="112" y2="152" stroke="#f6e4b0" stroke-width="2.4" stroke-linecap="round"/>
<line x1="206" y1="176" x2="210" y2="162" stroke="#f6e4b0" stroke-width="2.4" stroke-linecap="round"/>
<path d="M146,206 C156,224 168,250 176,286" fill="none" stroke="#f6e4b0" stroke-width="2" stroke-linecap="round" opacity=".55"/>
<g opacity=".85">
<path d="M40,44 l3,8 l8,1 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 l8,-1 Z" fill="#cda14e"/>
<path d="M272,40 q8,4 14,0 q-7,8 -14,8 q-7,0 -14,-8 q6,4 14,0 Z" fill="#cda14e"/>
<g fill="none" stroke="#cda14e" stroke-width="2"><circle cx="46" cy="428" r="6"/><path d="M40,420 l4,4 M52,420 l-4,4"/></g>
<g fill="none" stroke="#cda14e" stroke-width="2"><circle cx="274" cy="428" r="6"/><path d="M268,427 l-4,-2 M268,431 l-4,2 M280,427 l4,-2 M280,431 l4,2"/></g>
</g>
<rect width="320" height="470" fill="url(#w-vig)"/>
</svg>`;
}

function artSVG(id) {
  if (id === "magician") return magicianSVG();
  if (id === "world") return worldSVG();
  return foolSVG();
}
const dataUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* ---------- the mosaic edge.
   The CENTRE is a single continuous image (no tiles). Only a band of
   EDGE_RINGS rings around the perimeter is broken into tesserae that fade,
   jitter and go sparse toward the edge, so the card erodes into the cosmos
   instead of ending at a hard rectangle.
   The full grid is still computed (interior tiles kept SOLID) because the
   navigation dissolve shatters the whole card — but at rest only the band
   tiles are drawn, over a continuous core. ------------------------------- */
const COLS = 24, ROWS = 35, GAP = 0.9, EDGE_RINGS = 5;
function buildMosaic(cw, ch) {
  if (!cw || !ch) return { tiles: [], cellW: 0, cellH: 0 };
  const cellW = cw / COLS, cellH = ch / ROWS;
  const cx = cw / 2, cy = ch / 2, maxD = Math.hypot(cw, ch) / 2;
  const r = rng(2025);
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ringX = Math.min(col, COLS - 1 - col), ringY = Math.min(row, ROWS - 1 - row);
      const ring = Math.min(ringX, ringY);
      // Organic dissolve: a continuous probability across the band (not clean
      // rings). Survival + opacity + jitter all driven by depth-from-edge plus
      // per-tile noise, so tesserae thin out delicately and irregularly.
      let omit = false, ho = 1, hx = 0, hy = 0, hr = 0;
      if (ring < EDGE_RINGS) {
        const t = ring / EDGE_RINGS;                 // 0 at the very edge → ~1 toward the core
        const pSurv = 0.02 + t * 1.12;               // outer: very sparse; inner: nearly full
        omit = r() > pSurv;
        ho = Math.max(0.07, Math.min(1, 0.1 + t * 0.98 + (r() - 0.5) * 0.24));
        const j = 1 - t;                             // outer fragments drift more
        hx = (r() - 0.5) * 6.5 * j; hy = (r() - 0.5) * 6.5 * j; hr = (r() - 0.5) * 18 * j;
      } else if (ring === EDGE_RINGS) {
        // quiet bridge ring: solid, tucks under the crumble and over the core edge
        ho = 1; hx = (r() - 0.5) * 0.7; hy = (r() - 0.5) * 0.7; hr = (r() - 0.5) * 1.4;
      } else {
        ho = 1; r(); r(); r(); // keep the sequence aligned for deterministic scatter
      }
      // scatter for the dissolve (direction applied at render)
      const tx = col * cellW + cellW / 2, ty = row * cellH + cellH / 2;
      const vx = tx - cx, vy = ty - cy, dist = Math.max(1, Math.hypot(vx, vy)), dn = dist / maxD;
      const ux = vx / dist, uy = vy / dist, pX = -uy, pY = ux;
      const R = 55 + dn * 80 + r() * 40, Sw = 42 + dn * 66;
      tiles.push({
        col, row, ring, omit,
        left: +(col * cellW + GAP / 2).toFixed(2), top: +(row * cellH + GAP / 2).toFixed(2),
        w: +(cellW - GAP).toFixed(2), h: +(cellH - GAP).toFixed(2),
        bgx: +(-(col * cellW + GAP / 2)).toFixed(2), bgy: +(-(row * cellH + GAP / 2)).toFixed(2),
        ho: +ho.toFixed(2), hx: +hx.toFixed(1), hy: +hy.toFixed(1), hr: +hr.toFixed(1),
        radx: +(ux * R).toFixed(1), rady: +(uy * R).toFixed(1),
        tanx: +(pX * Sw).toFixed(1), tany: +(pY * Sw).toFixed(1),
        sjx: +((r() - 0.5) * 22).toFixed(1), sjy: +((r() - 0.5) * 22).toFixed(1),
        baseRot: +(60 + dn * 130).toFixed(1), rotJit: +((r() - 0.5) * 64).toFixed(1),
        ds: +(0.3 + r() * 0.22).toFixed(2),
        do: Math.round((1 - dn) * 175), di: Math.round(dn * 205), // OUT peels edges-first; IN builds centre-first
      });
    }
  }
  return { tiles, cellW, cellH };
}

  /* ---------- element glyph (card back), as an SVG string ---------- */
  function elementGlyphSVG(kind) {
    var st = 'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"';
    if (kind === "EARTH") return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6 L21 6 L12 21 Z" ' + st + '/><line x1="7" y1="14.5" x2="17" y2="14.5" ' + st + '/></svg>';
    if (kind === "FIRE")  return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 19 L12 4 L21 19 Z" ' + st + '/></svg>';
    if (kind === "WATER") return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6 L21 6 L12 21 Z" ' + st + '/></svg>';
    return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 19 L12 4 L21 19 Z" ' + st + '/><line x1="7" y1="13" x2="17" y2="13" ' + st + '/></svg>';
  }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function imgFor(card) { return card.image ? 'url("' + card.image + '")' : dataUrl(artSVG(card.id || "fool")); }

  /* ---------- timing for the dissolve ---------- */
  var T1 = 580, T2 = 1280, T3 = 1480; // out done / in done / overlay removed

  var SCAFFOLD =
    '<canvas class="ac-stars"></canvas>' +
    '<div class="ac-neb"></div>' +
    '<header class="ac-head"><div class="ac-mark"><span class="rule"></span><span>ARCANA</span><span class="rule"></span></div>' +
    '<nav class="ac-nav"><a class="on">HOME</a><a>THE CARDS</a><a>READING</a></nav></header>' +
    '<main class="ac-stage">' +
      '<button class="ac-side" data-dir="-1" type="button"><span class="disc"><em></em></span><span class="lbl"></span></button>' +
      '<div class="ac-zone">' +
        '<div class="ac-eyebrow"><span class="rule"></span> MAJOR ARCANA <span class="rule"></span></div>' +
        '<div class="ac-shadow"></div>' +
        '<div class="ac-float">' +
          '<div class="ac-tilt" tabindex="0" role="button">' +
            '<div class="ac-flip">' +
              '<div class="ac-face ac-front">' +
                '<div class="front-light"></div>' +
                '<div class="art-core"></div>' +
                '<div class="mosaic"></div>' +
                '<div class="holo" style="background-position:var(--gx) var(--gy);opacity:var(--foil)"></div>' +
                '<div class="glare" style="background:radial-gradient(circle at var(--gx) var(--gy), rgba(255,246,222,.95), rgba(255,246,222,0) 45%);opacity:var(--glare)"></div>' +
                '<div class="scrim-t"></div><div class="scrim-b"></div>' +
                '<div class="numeral"></div>' +
                '<div class="plate"><div class="name"></div><div class="kw"></div></div>' +
              '</div>' +
              '<div class="ac-face ac-back">' +
                '<div class="back-glow"></div>' +
                '<div class="watermark"></div>' +
                '<div class="holo holo-soft" style="background-position:var(--gx) var(--gy);opacity:calc(var(--foil) * 0.55)"></div>' +
                '<div class="back-body"></div>' +
                '<div class="edge"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ac-hint"></div>' +
      '</div>' +
      '<button class="ac-side" data-dir="1" type="button"><span class="disc"><em></em></span><span class="lbl"></span></button>' +
    '</main>' +
    '<footer class="ac-foot"><div class="ac-rail"><span class="cap">00</span><div class="track"><div class="fill"></div><div class="bead"></div></div><span class="cap">XXI</span></div>' +
    '<button class="ac-cta" type="button">\u2726 &nbsp;BEGIN A READING</button></footer>' +
    '<div class="ac-grain"></div>';

  function mount(container, opts) {
    opts = opts || {};
    var cards = (opts.cards && opts.cards.length) ? opts.cards : CARDS;
    var index = (opts.start != null && opts.start >= 0 && opts.start < cards.length) ? opts.start
      : Math.min(1, cards.length - 1);

    var flipped = false, busy = false;
    var tilt = { rx: 0, ry: 0, gx: 50, gy: 50, on: false };
    var initW = Math.min(348, ((global.innerWidth || 1000) * 0.76));
    var size = { cw: Math.round(initW), ch: Math.round(initW * 470 / 320) };
    var mosaicData = buildMosaic(size.cw, size.ch);
    var reduce = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var timers = [];

    container.classList.add("arcana");
    container.innerHTML = SCAFFOLD;

    var canvas = container.querySelector(".ac-stars");
    var neb = container.querySelector(".ac-neb");
    var floatEl = container.querySelector(".ac-float");
    var tiltEl = container.querySelector(".ac-tilt");
    var flipEl = container.querySelector(".ac-flip");
    var frontEl = container.querySelector(".ac-front");
    var coreEl = container.querySelector(".art-core");
    var mosaicEl = container.querySelector(".mosaic");
    var numEl = container.querySelector(".numeral");
    var nameEl = container.querySelector(".plate .name");
    var kwEl = container.querySelector(".plate .kw");
    var watermark = container.querySelector(".watermark");
    var backBody = container.querySelector(".back-body");
    var hintEl = container.querySelector(".ac-hint");
    var railFill = container.querySelector(".ac-rail .fill");
    var railBead = container.querySelector(".ac-rail .bead");
    var prevBtn = container.querySelector('.ac-side[data-dir="-1"]');
    var nextBtn = container.querySelector('.ac-side[data-dir="1"]');
    var prevEm = prevBtn.querySelector("em"), prevLbl = prevBtn.querySelector(".lbl");
    var nextEm = nextBtn.querySelector("em"), nextLbl = nextBtn.querySelector(".lbl");

    function prevI() { return (index - 1 + cards.length) % cards.length; }
    function nextI() { return (index + 1) % cards.length; }
    function setV(node, k, v) { node.style.setProperty(k, v); }

    function applySize() {
      setV(frontEl, "--cw", size.cw + "px");
      setV(frontEl, "--ch", size.ch + "px");
      coreEl.style.clipPath = "inset(" + (EDGE_RINGS * mosaicData.cellH).toFixed(1) + "px " +
        (EDGE_RINGS * mosaicData.cellW).toFixed(1) + "px round 18px)";
    }

    function buildRest() {
      mosaicEl.innerHTML = "";
      var frag = document.createDocumentFragment();
      for (var i = 0; i < mosaicData.tiles.length; i++) {
        var t = mosaicData.tiles[i];
        if (t.omit || t.ring > EDGE_RINGS) continue;
        var d = document.createElement("div");
        d.className = "tile rest";
        d.style.left = t.left + "px"; d.style.top = t.top + "px";
        d.style.width = t.w + "px"; d.style.height = t.h + "px";
        d.style.backgroundPosition = t.bgx + "px " + t.bgy + "px";
        d.style.transform = "translate(" + t.hx + "px," + t.hy + "px) rotate(" + t.hr + "deg)";
        d.style.opacity = t.ho;
        frag.appendChild(d);
      }
      mosaicEl.appendChild(frag);
    }

    function buildOverlayTiles(overlay, mode, dir) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < mosaicData.tiles.length; i++) {
        var t = mosaicData.tiles[i];
        if (t.omit || t.ring > EDGE_RINGS) continue; // edge-only: centre is the core
        var dx = t.radx + dir * t.tanx + t.sjx;
        var dy = t.rady + dir * t.tany + t.sjy;
        var dr = dir * t.baseRot + t.rotJit;
        var d = document.createElement("div");
        d.className = "tile " + mode;
        d.style.left = t.left + "px"; d.style.top = t.top + "px";
        d.style.width = t.w + "px"; d.style.height = t.h + "px";
        d.style.backgroundPosition = t.bgx + "px " + t.bgy + "px";
        d.style.animationDelay = (mode === "out" ? t.do : t.di) + "ms";
        d.style.setProperty("--hx", t.hx + "px"); d.style.setProperty("--hy", t.hy + "px");
        d.style.setProperty("--hr", t.hr + "deg"); d.style.setProperty("--ho", t.ho);
        d.style.setProperty("--dx", dx + "px"); d.style.setProperty("--dy", dy + "px");
        d.style.setProperty("--dr", dr + "deg"); d.style.setProperty("--ds", t.ds);
        frag.appendChild(d);
      }
      overlay.appendChild(frag);
    }

    function setCard(i) {
      index = i;
      var c = cards[index];
      numEl.textContent = c.roman;
      nameEl.textContent = c.name;
      kwEl.textContent = (c.keywords || []).join(" \u00b7 ");
      watermark.textContent = c.roman;
      backBody.innerHTML =
        '<div class="b-eyebrow">CARD ' + esc(c.num) + '</div>' +
        '<div class="b-name">' + esc(c.name) + '</div>' +
        '<div class="b-div"><span></span><span class="dot">\u2726</span><span></span></div>' +
        '<div class="b-element"><span class="glyph">' + elementGlyphSVG(c.element) +
          '</span><span class="b-el-text"><em>ELEMENT</em>' + esc(c.element) + '</span></div>' +
        '<p class="b-meaning">' + esc(c.meaning) + '</p>' +
        '<div class="b-foot">MAJOR ARCANA \u00b7 ' + esc(c.num) + ' OF XXI</div>';
      setV(frontEl, "--img", imgFor(c));
      var f = (parseInt(c.num, 10) / 21) * 100;
      railFill.style.width = f + "%"; railBead.style.left = f + "%";
      var p = cards[prevI()], nx = cards[nextI()];
      prevEm.textContent = p.roman; prevLbl.textContent = "\u2190 " + p.name.replace("THE ", "");
      nextEm.textContent = nx.roman; nextLbl.textContent = nx.name.replace("THE ", "") + " \u2192";
    }

    function applyTilt() {
      var t = tilt, mag = Math.min(1, Math.sqrt(t.rx * t.rx + t.ry * t.ry) / 15);
      var foil = t.on ? 0.28 + mag * 0.34 : 0, glare = t.on ? 0.16 + mag * 0.4 : 0;
      tiltEl.style.transform = busy
        ? "rotateX(0deg) rotateY(0deg) scale(1)"
        : "rotateX(" + t.rx + "deg) rotateY(" + t.ry + "deg) scale(" + (t.on ? 1.03 : 1) + ")";
      setV(flipEl, "--gx", t.gx + "%"); setV(flipEl, "--gy", t.gy + "%");
      setV(flipEl, "--foil", foil); setV(flipEl, "--glare", glare);
      neb.style.transform = "translate(" + (t.ry * -1.4) + "px," + (t.rx * 1.4) + "px)";
      floatEl.style.animationPlayState = (t.on || busy) ? "paused" : "running";
    }
    function onMove(cx, cy) {
      if (busy) return;
      var r = tiltEl.getBoundingClientRect();
      var px = (cx - r.left) / r.width, py = (cy - r.top) / r.height, MAX = 15;
      tilt.rx = -(py - 0.5) * MAX; tilt.ry = (px - 0.5) * MAX;
      tilt.gx = px * 100; tilt.gy = py * 100; tilt.on = true;
      applyTilt();
    }
    function resetTilt() { tilt.rx = 0; tilt.ry = 0; tilt.gx = 50; tilt.gy = 50; tilt.on = false; applyTilt(); }

    function updateFlip() { flipEl.classList.toggle("is-flipped", flipped); }
    function updateHint() { hintEl.textContent = "MOVE TO TILT \u00b7 CLICK TO " + (flipped ? "RETURN" : "REVEAL"); }
    function toggleFlip() { if (busy) return; flipped = !flipped; updateFlip(); updateHint(); }
    function setDisabled() { prevBtn.disabled = busy; nextBtn.disabled = busy; }
    function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }

    function dissolve(target, dir) {
      if (busy || target === index) return;
      if (reduce || !size.cw) { setCard(target); flipped = false; updateFlip(); updateHint(); return; }
      busy = true; flipped = false; updateFlip(); resetTilt(); setDisabled();

      var overlay = document.createElement("div");
      overlay.className = "ac-dissolve";
      overlay.style.setProperty("--img", imgFor(cards[index]));
      overlay.style.setProperty("--cw", size.cw + "px");
      overlay.style.setProperty("--ch", size.ch + "px");
      var burst = document.createElement("div"); burst.className = "ac-burst"; overlay.appendChild(burst);
      var core = document.createElement("div"); core.className = "diss-core out";
      core.style.clipPath = "inset(" + (EDGE_RINGS * mosaicData.cellH).toFixed(1) + "px " +
        (EDGE_RINGS * mosaicData.cellW).toFixed(1) + "px round 18px)";
      overlay.appendChild(core);
      buildOverlayTiles(overlay, "out", dir);
      tiltEl.appendChild(overlay);
      flipEl.style.opacity = "0";
      applyTilt();

      clearTimers();
      timers.push(setTimeout(function () {
        setCard(target);
        overlay.style.setProperty("--img", imgFor(cards[index]));
        core.className = "diss-core in";
        var old = overlay.querySelectorAll(".tile");
        for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
        buildOverlayTiles(overlay, "in", dir);
      }, T1));
      timers.push(setTimeout(function () { overlay.style.opacity = "0"; flipEl.style.opacity = "1"; }, T2));
      timers.push(setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        busy = false; setDisabled(); applyTilt();
      }, T3));
    }

    function initStars() {
      if (!canvas.getContext) return;
      var ctx = canvas.getContext("2d");
      var w, h, dpr, stars = [], raf, running = true;
      function resize() {
        dpr = Math.min(global.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var r = rng(99), count = Math.min(150, Math.round((w * h) / 9000));
        stars = [];
        for (var i = 0; i < count; i++) stars.push({ x: r() * w, y: r() * h, r: 0.3 + r() * 1.4, a: 0.15 + r() * 0.55, sp: 0.4 + r() * 1.4, ph: r() * 6.28 });
      }
      function draw(ts) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          var a = reduce ? s.a : s.a + Math.sin(ts / 1000 * s.sp + s.ph) * 0.28;
          ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = "#f6e4b0";
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1; if (running && !reduce) raf = requestAnimationFrame(draw);
      }
      resize(); reduce ? draw(0) : (raf = requestAnimationFrame(draw));
      global.addEventListener("resize", resize);
    }

    function observeSize() {
      function apply() {
        var r = tiltEl.getBoundingClientRect();
        if (r.width > 2 && (Math.abs(r.width - size.cw) > 0.5 || Math.abs(r.height - size.ch) > 0.5)) {
          size.cw = r.width; size.ch = r.height;
          mosaicData = buildMosaic(size.cw, size.ch);
          applySize(); buildRest();
        }
      }
      apply();
      if ("ResizeObserver" in global) { new ResizeObserver(apply).observe(tiltEl); }
      else global.addEventListener("resize", apply);
    }

    // wire events
    tiltEl.addEventListener("mousemove", function (e) { onMove(e.clientX, e.clientY); });
    tiltEl.addEventListener("mouseleave", resetTilt);
    tiltEl.addEventListener("touchmove", function (e) { var t = e.touches[0]; if (t) { e.preventDefault(); onMove(t.clientX, t.clientY); } }, { passive: false });
    tiltEl.addEventListener("touchend", resetTilt);
    tiltEl.addEventListener("click", toggleFlip);
    tiltEl.addEventListener("keydown", function (e) {
      if (busy) return;
      if (e.key === "ArrowLeft") dissolve(prevI(), -1);
      else if (e.key === "ArrowRight") dissolve(nextI(), 1);
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleFlip(); }
    });
    prevBtn.addEventListener("click", function () { dissolve(prevI(), -1); });
    nextBtn.addEventListener("click", function () { dissolve(nextI(), 1); });

    // first paint
    setCard(index); applySize(); buildRest(); applyTilt(); updateHint();
    initStars(); observeSize();

    return {
      next: function () { dissolve(nextI(), 1); },
      prev: function () { dissolve(prevI(), -1); },
      flip: toggleFlip,
      go: function (i) { if (i !== index) dissolve(i, i > index ? 1 : -1); }
    };
  }

  function autoInit() {
    var nodes = document.querySelectorAll("[data-arcana-card]");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i], cards;
      var dataEl = node.querySelector('script[type="application/json"]');
      if (dataEl) { try { cards = JSON.parse(dataEl.textContent); } catch (e) {} }
      else if (node.getAttribute("data-cards")) { try { cards = JSON.parse(node.getAttribute("data-cards")); } catch (e) {} }
      var startAttr = node.getAttribute("data-start");
      mount(node, { cards: cards, start: startAttr != null ? parseInt(startAttr, 10) : undefined });
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState !== "loading") autoInit();
    else document.addEventListener("DOMContentLoaded", autoInit);
  }

  global.ArcanaCards = { mount: mount, defaultCards: CARDS, buildMosaic: buildMosaic };

})(typeof window !== "undefined" ? window : this);
